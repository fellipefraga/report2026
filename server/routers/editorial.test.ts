import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "../routers";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  listLLMModels: vi.fn(),
}));

vi.mock("../db", () => ({ getDb: mocks.getDb }));
vi.mock("../_core/llm", async importOriginal => {
  const original = await importOriginal<typeof import("../_core/llm")>();
  return { ...original, listLLMModels: mocks.listLLMModels };
});

const adminContext = {
  user: { id: 1, openId: "stellar-owner", email: "owner@stellar.com", name: "Stellar Owner", loginMethod: "manus", role: "admin" as const, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
  req: {} as any,
  res: {} as any,
};

function sourceCreateInput() {
  return { inputType: "text" as const, inputText: "Conteúdo editorial com dados suficientes para teste.", sourceUrl: null, title: "Fonte de teste", fileName: null, fileMimeType: null, storageKey: null };
}

describe("procedimentos editoriais", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cria uma fonte editorial autenticada", async () => {
    const values = vi.fn().mockResolvedValue([{ insertId: 42 }]);
    mocks.getDb.mockResolvedValue({ insert: vi.fn(() => ({ values })) });
    const caller = appRouter.createCaller(adminContext as any);

    await expect(caller.editorial.sources.create(sourceCreateInput())).resolves.toEqual({ id: 42 });
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ title: "Fonte de teste", createdBy: 1 }));
  });

  it("falha de modo previsível quando o banco editorial está indisponível", async () => {
    mocks.getDb.mockResolvedValue(null);
    const caller = appRouter.createCaller(adminContext as any);

    await expect(caller.editorial.sources.create(sourceCreateInput())).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" } satisfies Partial<TRPCError>);
  });

  it("valida a disponibilidade do modelo Claude configurado", async () => {
    const from = vi.fn().mockResolvedValue([{ key: "claude_model", value: "claude-sonnet-4-6" }, { key: "claude_temperature", value: "0.2" }, { key: "claude_base_prompt", value: "Prompt editorial com tamanho suficiente para a configuração." }]);
    mocks.getDb.mockResolvedValue({ select: vi.fn(() => ({ from })) });
    mocks.listLLMModels.mockResolvedValue({ data: [{ id: "claude-sonnet-4-6", object: "model", created: 0, owned_by: "anthropic" }] });
    const caller = appRouter.createCaller(adminContext as any);

    await expect(caller.editorial.settings.test()).resolves.toEqual({ available: true, model: "claude-sonnet-4-6" });
  });

  it("exporta o relatório em Markdown com os slides solicitados", async () => {
    const rows = [{ deckCode: "B2.1", orderIndex: 14, title: "GGR do semestre", content: "Conteúdo", notes: null, kpiMain: "R$ 20 bi", bullets: ["Um", "Dois", "Três"], sourceFooter: "SPA/MF", status: "approved" as const, sectionCode: "B2", sectionName: "Mercado" }];
    const query: any = { from: vi.fn(), leftJoin: vi.fn(), where: vi.fn(), orderBy: vi.fn() };
    query.from.mockReturnValue(query); query.leftJoin.mockReturnValue(query); query.where.mockReturnValue(query); query.orderBy.mockResolvedValue(rows);
    const values = vi.fn().mockResolvedValue([{ insertId: 1 }]);
    mocks.getDb.mockResolvedValue({ select: vi.fn(() => query), insert: vi.fn(() => ({ values })) });
    const caller = appRouter.createCaller(adminContext as any);

    const result = await caller.editorial.exports.generate({ format: "markdown", scope: "all" });

    expect(result.slideCount).toBe(1);
    expect(result.filename).toMatch(/\.md$/);
    expect(result.content).toContain("GGR do semestre");
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ format: "markdown", slideCount: 1 }));
  });

  it("retorna erro controlado quando a verificação do modelo não alcança o banco", async () => {
    mocks.getDb.mockResolvedValue(null);
    const caller = appRouter.createCaller(adminContext as any);

    await expect(caller.editorial.settings.test()).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" } satisfies Partial<TRPCError>);
  });

  it("retorna erro controlado quando a exportação não encontra o banco", async () => {
    mocks.getDb.mockResolvedValue(null);
    const caller = appRouter.createCaller(adminContext as any);

    await expect(caller.editorial.exports.generate({ format: "json", scope: "all" })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" } satisfies Partial<TRPCError>);
  });

  it("salva um slide e registra uma versão editorial", async () => {
    const slide = { id: 7, title: "Slide original", content: "Texto", notes: null, kpiMain: "KPI", bullets: ["Um", "Dois", "Três"], sourceFooter: "Fonte", status: "draft" as const };
    const whereUpdate = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn(() => ({ where: whereUpdate }));
    const versionValues = vi.fn().mockResolvedValue([{ insertId: 3 }]);
    const select = vi.fn()
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([slide]) })) })) })
      .mockReturnValueOnce({ from: vi.fn(() => ({ where: vi.fn().mockResolvedValue([{ maxVersion: 0 }]) })) });
    mocks.getDb.mockResolvedValue({
      update: vi.fn(() => ({ set })),
      delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue(undefined) })),
      insert: vi.fn(() => ({ values: versionValues })),
      select,
    });
    const caller = appRouter.createCaller(adminContext as any);

    await expect(caller.editorial.slides.update({ id: 7, title: "Slide revisado", content: "Conteúdo revisado", notes: "Nota", kpiMain: "Novo KPI", bullets: ["A", "B", "C"], sourceFooter: "Fonte oficial", status: "review", sourceIds: [] })).resolves.toEqual({ success: true });
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ title: "Slide revisado", status: "review", lastEditedBy: 1 }));
    expect(versionValues).toHaveBeenCalledWith(expect.objectContaining({ slideId: 7, versionNumber: 1 }));
  });

  it("bloqueia as operações de geração e restauração de slides sem banco editorial", async () => {
    mocks.getDb.mockResolvedValue(null);
    const caller = appRouter.createCaller(adminContext as any);

    await expect(caller.editorial.slides.generate({ slideId: 7 })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" } satisfies Partial<TRPCError>);
    await expect(caller.editorial.slides.restoreVersion({ versionId: 3 })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" } satisfies Partial<TRPCError>);
  });
});
