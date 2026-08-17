import { z } from "zod";

export const DEFAULT_CLAUDE_MODEL = "claude-sonnet-4-6";
export const DEFAULT_TEMPERATURE = 0.2;
export const DEFAULT_EDITORIAL_PROMPT =
  "Você é o processador de inteligência editorial do Relatório Stellar Gaming 2026. Produza conteúdo técnico, rigoroso, em português, baseado exclusivamente nas fontes fornecidas. Não invente dados; sinalize lacunas como 'a confirmar'. Sugira alocação apenas entre os 81 slides do sumário editorial.";

export const sourceProcessingSchema = z.object({
  classification: z.object({
    tema: z.string(),
    secoes: z.array(z.string()).min(1),
    confiabilidade: z.enum(["alta", "media", "baixa"]),
    resumo: z.string(),
  }),
  insights: z.array(z.string()).min(1).max(8),
  suggestedSlideCodes: z.array(z.string()).max(8),
});

export const slideGenerationSchema = z.object({
  title: z.string().min(1).max(320),
  kpiMain: z.string().max(320),
  bullets: z.array(z.string()).min(3).max(3),
  content: z.string().min(1),
  notes: z.string(),
  sourceFooter: z.string(),
});

export type SourceProcessingResult = z.infer<typeof sourceProcessingSchema>;
export type SlideGenerationResult = z.infer<typeof slideGenerationSchema>;

export function parseModelOutput<T>(content: string, schema: z.ZodType<T>): T {
  const cleaned = content.trim().replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  return schema.parse(JSON.parse(cleaned));
}

export function responseText(content: string | Array<{ type: string; text?: string }>): string {
  if (typeof content === "string") return content;
  return content
    .filter(part => part.type === "text")
    .map(part => part.text ?? "")
    .join("\n")
    .trim();
}

export function clampTemperature(value: string | number | undefined): number {
  const parsed = Number(value ?? DEFAULT_TEMPERATURE);
  if (!Number.isFinite(parsed)) return DEFAULT_TEMPERATURE;
  return Math.min(1, Math.max(0, parsed));
}

export type ExportableSlide = {
  deckCode: string;
  orderIndex: number;
  title: string;
  content: string;
  notes: string | null;
  kpiMain: string | null;
  bullets: string[];
  sourceFooter: string | null;
  status: "draft" | "review" | "approved";
  sectionCode: string | null;
  sectionName: string | null;
};

export function exportSlidesAsMarkdown(slides: ExportableSlide[]): string {
  const groups = new Map<string, ExportableSlide[]>();
  for (const slide of slides) {
    const key = `${slide.sectionCode ?? "SEM_SECAO"}|${slide.sectionName ?? "Sem seção"}`;
    groups.set(key, [...(groups.get(key) ?? []), slide]);
  }

  const body = Array.from(groups.values())
    .map((group: ExportableSlide[]) => {
      const first = group[0];
      const heading = `## ${first.sectionCode ?? ""} — ${first.sectionName ?? "Sem seção"}`.trim();
      const slidesMarkdown = group
        .map((slide: ExportableSlide) => {
          const bullets = slide.bullets.map((bullet: string) => `- ${bullet}`).join("\n");
          return `### ${slide.orderIndex}. ${slide.deckCode} — ${slide.title}\n\n**Status:** ${slide.status}\n\n**KPI:** ${slide.kpiMain ?? "—"}\n\n${bullets}\n\n**Conteúdo:**\n${slide.content}\n\n**Notas editoriais:**\n${slide.notes ?? "—"}\n\n**Fonte:** ${slide.sourceFooter ?? "—"}`;
        })
        .join("\n\n---\n\n");
      return `${heading}\n\n${slidesMarkdown}`;
    })
    .join("\n\n---\n\n");

  return `# Stellar Report App — Exportação Editorial\n\nGerado em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeStyle: "short" }).format(new Date())}.\n\n${body}\n`;
}

export function sourceProcessingPrompt(input: {
  sourceTitle?: string | null;
  sourceReference: string;
  slideCatalog: Array<{ deckCode: string; title: string; sectionName: string | null }>;
}) {
  const catalog = input.slideCatalog
    .map(slide => `${slide.deckCode} | ${slide.sectionName ?? "Sem seção"} | ${slide.title}`)
    .join("\n");
  return `Analise a fonte editorial abaixo. Identifique somente informações observáveis no material fornecido.\n\nTÍTULO: ${input.sourceTitle ?? "Sem título"}\n\nFONTE:\n${input.sourceReference}\n\nCATÁLOGO DOS 81 SLIDES:\n${catalog}\n\nRetorne: classificação por tema e seções, até 8 insights e os códigos de slides mais adequados. Use apenas códigos existentes no catálogo.`;
}

export function slideGenerationPrompt(input: {
  slide: { deckCode: string; title: string; content: string; notes: string | null; sectionName: string | null };
  sources: Array<{ title: string | null; inputText: string | null; classification: unknown; insights: unknown }>;
}) {
  const sources = input.sources.length
    ? input.sources
        .map(source => `FONTE: ${source.title ?? "Sem título"}\nTEXTO: ${source.inputText ?? "Sem texto"}\nCLASSIFICAÇÃO: ${JSON.stringify(source.classification ?? {})}\nINSIGHTS: ${JSON.stringify(source.insights ?? [])}`)
        .join("\n\n")
    : "Nenhuma fonte vinculada. Preserve o conteúdo existente e sinalize onde são necessárias novas fontes.";
  return `Gere uma versão editorial para o slide ${input.slide.deckCode}, pertencente a ${input.slide.sectionName ?? "Sem seção"}.\n\nTÍTULO ATUAL: ${input.slide.title}\nCONTEÚDO ATUAL:\n${input.slide.content}\nNOTAS ATUAIS:\n${input.slide.notes ?? "—"}\n\nFONTES VINCULADAS:\n${sources}\n\nRegras: título conciso; exatamente 3 bullets; distingua fatos de hipóteses; não invente números; fonte concisa no rodapé; notas com pendências editoriais, se houver.`;
}
