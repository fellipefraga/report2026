import { describe, expect, it } from "vitest";
import {
  clampTemperature,
  exportSlidesAsMarkdown,
  parseModelOutput,
  slideGenerationSchema,
  sourceProcessingSchema,
} from "./editorial";

describe("regras editoriais", () => {
  it("limita a temperatura a uma faixa segura", () => {
    expect(clampTemperature("0.4")).toBe(0.4);
    expect(clampTemperature(4)).toBe(1);
    expect(clampTemperature(-2)).toBe(0);
    expect(clampTemperature("invalido")).toBe(0.2);
  });

  it("aceita a resposta estruturada de classificação de fonte", () => {
    const result = parseModelOutput(
      JSON.stringify({
        classification: { tema: "Mercado", secoes: ["B2"], confiabilidade: "alta", resumo: "Dados oficiais do semestre." },
        insights: ["O GGR cresceu em ritmo moderado."],
        suggestedSlideCodes: ["B2.1"],
      }),
      sourceProcessingSchema,
    );

    expect(result.classification.tema).toBe("Mercado");
    expect(result.suggestedSlideCodes).toEqual(["B2.1"]);
  });

  it("remove delimitadores markdown antes de validar resposta de slide", () => {
    const result = parseModelOutput(
      "```json\n" + JSON.stringify({ title: "Mercado regulado avança", kpiMain: "R$ 20 bi", bullets: ["Dado um", "Dado dois", "Dado três"], content: "Texto editorial.", notes: "Revisar fonte.", sourceFooter: "SPA/MF, 2026" }) + "\n```",
      slideGenerationSchema,
    );

    expect(result.bullets).toHaveLength(3);
    expect(result.title).toContain("Mercado");
  });

  it("exporta slides agrupados por seção em Markdown", () => {
    const markdown = exportSlidesAsMarkdown([{
      deckCode: "B2.1",
      orderIndex: 14,
      title: "GGR do semestre",
      content: "Conteúdo do slide.",
      notes: "Revisar em setembro.",
      kpiMain: "R$ 20,07 bi",
      bullets: ["Bullet um", "Bullet dois", "Bullet três"],
      sourceFooter: "SPA/MF, 2026",
      status: "approved",
      sectionCode: "B2",
      sectionName: "Mercado e Arrecadação",
    }]);

    expect(markdown).toContain("## B2 — Mercado e Arrecadação");
    expect(markdown).toContain("### 14. B2.1 — GGR do semestre");
    expect(markdown).toContain("**Status:** approved");
  });
});
