import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
  appConfig,
  exportHistory,
  reportSections,
  slideVersions,
  slides,
  sourceSlides,
  sources,
  teamAccess,
} from "../../drizzle/schema";
import { getDb } from "../db";
import {
  clampTemperature,
  DEFAULT_CLAUDE_MODEL,
  DEFAULT_EDITORIAL_PROMPT,
  exportSlidesAsMarkdown,
  parseModelOutput,
  responseText,
  slideGenerationPrompt,
  slideGenerationSchema,
  sourceProcessingPrompt,
  sourceProcessingSchema,
} from "../editorial";
import { invokeLLM, listLLMModels } from "../_core/llm";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

const slideStatus = z.enum(["draft", "review", "approved"]);

const editorialProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role === "admin") return next({ ctx });
  if (!ctx.user.email) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas membros autorizados da equipe Stellar podem acessar este relatório." });
  }
  const db = await getDb();
  const allowed = db
    ? await db
        .select({ id: teamAccess.id })
        .from(teamAccess)
        .where(and(eq(teamAccess.email, ctx.user.email), eq(teamAccess.active, true)))
        .limit(1)
    : [];
  if (allowed.length === 0) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas membros autorizados da equipe Stellar podem acessar este relatório." });
  }
  return next({ ctx });
});

const adminEditorialProcedure = editorialProcedure.use(async ({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem alterar as configurações do relatório." });
  }
  return next({ ctx });
});

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
  return db;
}

async function getConfigValues() {
  const db = await requireDb();
  const rows = await db.select().from(appConfig);
  const map = Object.fromEntries(rows.map(row => [row.key, row.value]));
  return {
    model: map.claude_model || DEFAULT_CLAUDE_MODEL,
    temperature: clampTemperature(map.claude_temperature),
    basePrompt: map.claude_base_prompt || DEFAULT_EDITORIAL_PROMPT,
  };
}

async function getSlideCatalog() {
  const db = await requireDb();
  return db
    .select({ deckCode: slides.deckCode, title: slides.title, sectionName: reportSections.name })
    .from(slides)
    .leftJoin(reportSections, eq(slides.sectionId, reportSections.id))
    .orderBy(asc(slides.orderIndex));
}

function assertPublicSourceUrl(value: string) {
  const url = new URL(value);
  const hostname = url.hostname.toLowerCase();
  const blocked = hostname === "localhost" || hostname.endsWith(".local") || hostname === "0.0.0.0" || hostname === "::1" || /^127\./.test(hostname) || /^10\./.test(hostname) || /^192\.168\./.test(hostname) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname);
  if (!/^https?:$/.test(url.protocol) || blocked) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "A URL informada não é elegível para processamento." });
  }
  return url;
}

function htmlToText(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function sourceContentForProcessing(source: typeof sources.$inferSelect) {
  if (source.inputType === "url" && source.sourceUrl) {
    const url = assertPublicSourceUrl(source.sourceUrl);
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000), redirect: "follow", headers: { "User-Agent": "Stellar-Report-Research/1.0" } });
    if (!response.ok) throw new Error(`Não foi possível acessar a URL da fonte (${response.status}).`);
    const text = htmlToText(await response.text()).slice(0, 50_000);
    if (text.length < 80) throw new Error("A URL não retornou conteúdo textual suficiente para análise.");
    return text;
  }
  if (source.inputText && source.inputText.trim().length >= 20) return source.inputText.slice(0, 50_000);
  throw new Error("Esta fonte não contém texto extraível. Envie um arquivo textual ou acrescente um resumo para processamento.");
}

async function createVersion(slideId: number, userId: number) {
  const db = await requireDb();
  const [slide] = await db.select().from(slides).where(eq(slides.id, slideId)).limit(1);
  if (!slide) throw new TRPCError({ code: "NOT_FOUND", message: "Slide não encontrado." });
  const [version] = await db
    .select({ maxVersion: sql<number>`COALESCE(MAX(${slideVersions.versionNumber}), 0)` })
    .from(slideVersions)
    .where(eq(slideVersions.slideId, slideId));
  await db.insert(slideVersions).values({
    slideId,
    createdBy: userId,
    versionNumber: Number(version?.maxVersion ?? 0) + 1,
    title: slide.title,
    content: slide.content,
    notes: slide.notes,
    kpiMain: slide.kpiMain,
    bullets: slide.bullets,
    sourceFooter: slide.sourceFooter,
    status: slide.status,
  });
}

const updateSlideInput = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(320),
  content: z.string().min(1),
  notes: z.string().nullable(),
  kpiMain: z.string().nullable(),
  bullets: z.array(z.string()).min(1).max(6),
  sourceFooter: z.string().nullable(),
  status: slideStatus,
  sourceIds: z.array(z.number().int().positive()).max(20),
});

export const editorialRouter = router({
  dashboard: editorialProcedure.query(async () => {
    const db = await requireDb();
    const [counts] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        approved: sql<number>`SUM(CASE WHEN ${slides.status} = 'approved' THEN 1 ELSE 0 END)`,
        review: sql<number>`SUM(CASE WHEN ${slides.status} = 'review' THEN 1 ELSE 0 END)`,
        draft: sql<number>`SUM(CASE WHEN ${slides.status} = 'draft' THEN 1 ELSE 0 END)`,
      })
      .from(slides);
    const recentSources = await db.select().from(sources).orderBy(desc(sources.createdAt)).limit(6);
    const sections = await db
      .select({
        id: reportSections.id,
        code: reportSections.code,
        name: reportSections.name,
        total: sql<number>`COUNT(${slides.id})`,
        approved: sql<number>`SUM(CASE WHEN ${slides.status} = 'approved' THEN 1 ELSE 0 END)`,
      })
      .from(reportSections)
      .leftJoin(slides, eq(slides.sectionId, reportSections.id))
      .groupBy(reportSections.id)
      .orderBy(asc(reportSections.orderIndex));
    return { counts, recentSources, sections };
  }),

  slides: router({
    list: editorialProcedure.query(async () => {
      const db = await requireDb();
      return db
        .select({
          id: slides.id,
          deckCode: slides.deckCode,
          orderIndex: slides.orderIndex,
          title: slides.title,
          content: slides.content,
          notes: slides.notes,
          kpiMain: slides.kpiMain,
          bullets: slides.bullets,
          sourceFooter: slides.sourceFooter,
          status: slides.status,
          updatedAt: slides.updatedAt,
          sectionCode: reportSections.code,
          sectionName: reportSections.name,
        })
        .from(slides)
        .leftJoin(reportSections, eq(slides.sectionId, reportSections.id))
        .orderBy(asc(slides.orderIndex));
    }),
    get: editorialProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
      const db = await requireDb();
      const [slide] = await db
        .select({
          id: slides.id,
          deckCode: slides.deckCode,
          orderIndex: slides.orderIndex,
          title: slides.title,
          content: slides.content,
          notes: slides.notes,
          kpiMain: slides.kpiMain,
          bullets: slides.bullets,
          sourceFooter: slides.sourceFooter,
          status: slides.status,
          updatedAt: slides.updatedAt,
          sectionCode: reportSections.code,
          sectionName: reportSections.name,
        })
        .from(slides)
        .leftJoin(reportSections, eq(slides.sectionId, reportSections.id))
        .where(eq(slides.id, input.id))
        .limit(1);
      if (!slide) throw new TRPCError({ code: "NOT_FOUND", message: "Slide não encontrado." });
      const linkedSources = await db
        .select({ id: sources.id, title: sources.title, sourceUrl: sources.sourceUrl, processingStatus: sources.processingStatus })
        .from(sourceSlides)
        .innerJoin(sources, eq(sourceSlides.sourceId, sources.id))
        .where(eq(sourceSlides.slideId, input.id));
      const versions = await db
        .select()
        .from(slideVersions)
        .where(eq(slideVersions.slideId, input.id))
        .orderBy(desc(slideVersions.versionNumber))
        .limit(12);
      return { slide, linkedSources, versions };
    }),
    update: editorialProcedure.input(updateSlideInput).mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      await db
        .update(slides)
        .set({
          title: input.title,
          content: input.content,
          notes: input.notes,
          kpiMain: input.kpiMain,
          bullets: input.bullets,
          sourceFooter: input.sourceFooter,
          status: input.status,
          lastEditedBy: ctx.user.id,
        })
        .where(eq(slides.id, input.id));
      await db.delete(sourceSlides).where(eq(sourceSlides.slideId, input.id));
      if (input.sourceIds.length > 0) {
        await db.insert(sourceSlides).values(input.sourceIds.map(sourceId => ({ sourceId, slideId: input.id })));
      }
      await createVersion(input.id, ctx.user.id);
      return { success: true };
    }),
    restoreVersion: editorialProcedure.input(z.object({ versionId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const [version] = await db.select().from(slideVersions).where(eq(slideVersions.id, input.versionId)).limit(1);
      if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Versão não encontrada." });
      await db
        .update(slides)
        .set({
          title: version.title,
          content: version.content,
          notes: version.notes,
          kpiMain: version.kpiMain,
          bullets: version.bullets,
          sourceFooter: version.sourceFooter,
          status: version.status,
          lastEditedBy: ctx.user.id,
        })
        .where(eq(slides.id, version.slideId));
      await createVersion(version.slideId, ctx.user.id);
      return { success: true, slideId: version.slideId };
    }),
    generate: editorialProcedure.input(z.object({ slideId: z.number().int().positive() })).mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const [slide] = await db
        .select({ deckCode: slides.deckCode, title: slides.title, content: slides.content, notes: slides.notes, sectionName: reportSections.name })
        .from(slides)
        .leftJoin(reportSections, eq(slides.sectionId, reportSections.id))
        .where(eq(slides.id, input.slideId))
        .limit(1);
      if (!slide) throw new TRPCError({ code: "NOT_FOUND", message: "Slide não encontrado." });
      const linked = await db
        .select({ title: sources.title, inputText: sources.inputText, classification: sources.classification, insights: sources.extractedInsights })
        .from(sourceSlides)
        .innerJoin(sources, eq(sourceSlides.sourceId, sources.id))
        .where(eq(sourceSlides.slideId, input.slideId));
      const config = await getConfigValues();
      const result = await invokeLLM({
        model: config.model,
        temperature: config.temperature,
        max_tokens: 1600,
        messages: [
          { role: "system", content: config.basePrompt },
          { role: "user", content: slideGenerationPrompt({ slide, sources: linked }) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "slide_generation",
            strict: true,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" }, kpiMain: { type: "string" }, bullets: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 3 }, content: { type: "string" }, notes: { type: "string" }, sourceFooter: { type: "string" },
              },
              required: ["title", "kpiMain", "bullets", "content", "notes", "sourceFooter"],
              additionalProperties: false,
            },
          },
        },
      });
      const generated = parseModelOutput(responseText(result.choices[0]?.message.content ?? ""), slideGenerationSchema);
      await db.update(slides).set({ ...generated, lastEditedBy: ctx.user.id }).where(eq(slides.id, input.slideId));
      await createVersion(input.slideId, ctx.user.id);
      return generated;
    }),
  }),

  sources: router({
    list: editorialProcedure.query(async () => {
      const db = await requireDb();
      return db.select().from(sources).orderBy(desc(sources.createdAt));
    }),
    create: editorialProcedure.input(z.object({ inputType: z.enum(["url", "text", "upload"]), inputText: z.string().nullable(), sourceUrl: z.string().url().nullable(), title: z.string().max(320).nullable(), fileName: z.string().max(512).nullable(), fileMimeType: z.string().max(160).nullable(), storageKey: z.string().max(512).nullable() })).mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      if (input.inputType === "url" && input.sourceUrl) assertPublicSourceUrl(input.sourceUrl);
      const result = await db.insert(sources).values({ ...input, createdBy: ctx.user.id });
      return { id: Number(result[0].insertId) };
    }),
    update: editorialProcedure.input(z.object({ sourceId: z.number().int().positive(), title: z.string().min(1).max(320), inputText: z.string().nullable(), sourceUrl: z.string().url().nullable() })).mutation(async ({ input }) => {
      const db = await requireDb();
      if (input.sourceUrl) assertPublicSourceUrl(input.sourceUrl);
      await db.update(sources).set({ title: input.title, inputText: input.inputText, sourceUrl: input.sourceUrl, processingStatus: "pending", processingError: null, classification: null, extractedInsights: null, suggestedSlideCodes: null }).where(eq(sources.id, input.sourceId));
      return { success: true };
    }),
    upload: editorialProcedure.input(z.object({ fileName: z.string().min(1).max(512), mimeType: z.string().min(1).max(160), base64: z.string().min(1).max(8_000_000), extractedText: z.string().nullable(), title: z.string().max(320).nullable() })).mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const normalizedName = input.fileName.replace(/[^a-zA-Z0-9._-]+/g, "-");
      const bytes = Buffer.from(input.base64, "base64");
      if (bytes.byteLength > 5_000_000) {
        throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Cada arquivo deve ter no máximo 5 MB." });
      }
      const stored = await storagePut(`sources/${ctx.user.id}/${normalizedName}`, bytes, input.mimeType);
      const result = await db.insert(sources).values({
        createdBy: ctx.user.id,
        inputType: "upload",
        inputText: input.extractedText?.slice(0, 50_000) || null,
        title: input.title || input.fileName,
        fileName: input.fileName,
        fileMimeType: input.mimeType,
        storageKey: stored.key,
      });
      return { id: Number(result[0].insertId), url: stored.url };
    }),
    process: editorialProcedure.input(z.object({ sourceId: z.number().int().positive() })).mutation(async ({ input }) => {
      const db = await requireDb();
      const [source] = await db.select().from(sources).where(eq(sources.id, input.sourceId)).limit(1);
      if (!source) throw new TRPCError({ code: "NOT_FOUND", message: "Fonte não encontrada." });
      await db.update(sources).set({ processingStatus: "processing", processingError: null }).where(eq(sources.id, input.sourceId));
      try {
        const config = await getConfigValues();
        const sourceReference = await sourceContentForProcessing(source);
        const result = await invokeLLM({
          model: config.model,
          temperature: config.temperature,
          max_tokens: 1400,
          messages: [{ role: "system", content: config.basePrompt }, { role: "user", content: sourceProcessingPrompt({ sourceTitle: source.title, sourceReference, slideCatalog: await getSlideCatalog() }) }],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "source_processing",
              strict: true,
              schema: {
                type: "object",
                properties: { classification: { type: "object", properties: { tema: { type: "string" }, secoes: { type: "array", items: { type: "string" } }, confiabilidade: { type: "string", enum: ["alta", "media", "baixa"] }, resumo: { type: "string" } }, required: ["tema", "secoes", "confiabilidade", "resumo"], additionalProperties: false }, insights: { type: "array", items: { type: "string" } }, suggestedSlideCodes: { type: "array", items: { type: "string" } } },
                required: ["classification", "insights", "suggestedSlideCodes"], additionalProperties: false,
              },
            },
          },
        });
        const processed = parseModelOutput(responseText(result.choices[0]?.message.content ?? ""), sourceProcessingSchema);
        const validCodes = new Set((await getSlideCatalog()).map(slide => slide.deckCode));
        const suggestedSlideCodes = processed.suggestedSlideCodes.filter(code => validCodes.has(code));
        await db.update(sources).set({ classification: processed.classification, extractedInsights: processed.insights, suggestedSlideCodes, processingStatus: "done", processingError: null }).where(eq(sources.id, input.sourceId));
        return { ...processed, suggestedSlideCodes };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Falha no processamento da fonte.";
        await db.update(sources).set({ processingStatus: "error", processingError: message }).where(eq(sources.id, input.sourceId));
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
      }
    }),
    remove: editorialProcedure.input(z.object({ sourceId: z.number().int().positive() })).mutation(async ({ input }) => {
      const db = await requireDb();
      await db.delete(sources).where(eq(sources.id, input.sourceId));
      return { success: true };
    }),
  }),

  settings: router({
    get: editorialProcedure.query(async () => ({ ...(await getConfigValues()), apiKeyConfigured: true })),
    update: adminEditorialProcedure.input(z.object({ model: z.string().regex(/^claude-/), temperature: z.number().min(0).max(1), basePrompt: z.string().min(40).max(8000) })).mutation(async ({ input }) => {
      const db = await requireDb();
      const values = [
        { key: "claude_model", value: input.model },
        { key: "claude_temperature", value: String(input.temperature) },
        { key: "claude_base_prompt", value: input.basePrompt },
      ];
      for (const value of values) await db.insert(appConfig).values(value).onDuplicateKeyUpdate({ set: { value: value.value } });
      return { success: true };
    }),
    test: adminEditorialProcedure.mutation(async () => {
      const config = await getConfigValues();
      const models = await listLLMModels();
      return { available: models.data.some(model => model.id === config.model), model: config.model };
    }),
  }),

  exports: router({
    generate: editorialProcedure.input(z.object({ format: z.enum(["json", "markdown"]), scope: z.enum(["approved", "all"]).default("approved") })).mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const rows = await db
        .select({ deckCode: slides.deckCode, orderIndex: slides.orderIndex, title: slides.title, content: slides.content, notes: slides.notes, kpiMain: slides.kpiMain, bullets: slides.bullets, sourceFooter: slides.sourceFooter, status: slides.status, sectionCode: reportSections.code, sectionName: reportSections.name })
        .from(slides)
        .leftJoin(reportSections, eq(slides.sectionId, reportSections.id))
        .where(input.scope === "approved" ? eq(slides.status, "approved") : undefined)
        .orderBy(asc(slides.orderIndex));
      const content = input.format === "json" ? JSON.stringify({ generatedAt: new Date().toISOString(), scope: input.scope, slides: rows }, null, 2) : exportSlidesAsMarkdown(rows);
      await db.insert(exportHistory).values({ createdBy: ctx.user.id, format: input.format, scope: input.scope, slideCount: rows.length, generatedContent: content });
      return { filename: `stellar-report-2026-${input.scope}.${input.format === "json" ? "json" : "md"}`, mimeType: input.format === "json" ? "application/json" : "text/markdown", content, slideCount: rows.length };
    }),
  }),
});
