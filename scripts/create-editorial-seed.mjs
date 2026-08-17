import fs from "node:fs";
import path from "node:path";

const sourcePath = "/home/ubuntu/upload/stellar_2026_81slides.sql";
const outputPath = path.resolve("drizzle/seed_stellar_81.sql");
const raw = fs.readFileSync(sourcePath, "utf8");
const valuesStart = raw.indexOf("VALUES\n");
const valuesEnd = raw.lastIndexOf(";");
const tuplesSource = raw.slice(valuesStart + 7, valuesEnd).trim();

function splitTopLevel(input) {
  const result = [];
  let start = 0;
  let inString = false;

  for (let index = 0; index < input.length; index += 1) {
    if (input[index] === "'") {
      if (inString && input[index + 1] === "'") {
        index += 1;
        continue;
      }
      inString = !inString;
    }
    if (!inString && input[index] === "," && input[index + 1] === "\n") {
      result.push(input.slice(start, index).trim());
      start = index + 1;
    }
  }

  result.push(input.slice(start).trim());
  return result;
}

function splitFields(tuple) {
  const content = tuple.replace(/^\(/, "").replace(/\)$/, "");
  const fields = [];
  let current = "";
  let inString = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    if (char === "'") {
      current += char;
      if (inString && content[index + 1] === "'") {
        current += "'";
        index += 1;
        continue;
      }
      inString = !inString;
      continue;
    }
    if (char === "," && !inString) {
      fields.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  fields.push(current.trim());
  return fields;
}

function fromSqlString(value) {
  if (!value.startsWith("'") || !value.endsWith("'")) return value;
  return value.slice(1, -1).replaceAll("''", "'");
}

function toSqlString(value) {
  return `'${String(value ?? "").replaceAll("'", "''")}'`;
}

const sections = [
  [1, "A", "Abertura", "Capa, sumário e nota metodológica", 1],
  [2, "B1", "Marco Regulatório", "Evolução legal e mecanismos regulatórios", 2],
  [3, "B2", "Mercado e Arrecadação", "GGR, arrecadação, projeções e estrutura competitiva", 3],
  [4, "B3", "Pagamentos e Enforcement", "PIX, KYC, cadeia B2B e combate ao ilegal", 4],
  [5, "B4", "Usuários e Jogo Responsável", "Perfil, comportamento e proteção do apostador", 5],
  [6, "B5", "Mídia e Patrocínios", "Publicidade, futebol, influenciadores e transmissão", 6],
  [7, "B6", "Competição e Consolidação", "Concentração, M&A e sustentabilidade competitiva", 7],
  [8, "B7", "Perspectivas 2026–2028", "Agenda regulatória, projeções e variáveis de monitoramento", 8],
  [9, "B8", "Contexto Global", "Comparativos internacionais e tendências globais", 9],
  [10, "B9", "Stellar Gaming", "Posicionamento, metodologia e conclusão institucional", 10],
];

const sectionIdFor = deckCode => {
  if (deckCode.startsWith("A")) return 1;
  return Number(deckCode.slice(1, deckCode.indexOf("."))) + 1;
};

const rows = splitTopLevel(tuplesSource).map(tuple => {
  const [deckCodeRaw, titleRaw, kpiRaw, bulletsRaw, footerRaw, statusRaw, orderRaw] = splitFields(tuple);
  const deckCode = fromSqlString(deckCodeRaw);
  const title = fromSqlString(titleRaw);
  const kpiMain = fromSqlString(kpiRaw);
  const bullets = JSON.parse(
    fromSqlString(bulletsRaw).replace(/^\{/, "[").replace(/\}$/, "]"),
  );
  const sourceFooter = fromSqlString(footerRaw);
  const status = fromSqlString(statusRaw);
  const orderIndex = Number(orderRaw);
  const content = bullets.map((bullet, index) => `${index + 1}. ${bullet}`).join("\n");
  return { deckCode, title, kpiMain, bullets, sourceFooter, status, orderIndex, content };
});

if (rows.length !== 81) {
  throw new Error(`A base editorial deve conter exatamente 81 slides, mas contém ${rows.length}.`);
}

const sectionSql = sections
  .map(([id, code, name, description, orderIndex]) => `(${id}, ${toSqlString(code)}, ${toSqlString(name)}, ${toSqlString(description)}, ${orderIndex})`)
  .join(",\n");

const slideSql = rows
  .map(row => `(${sectionIdFor(row.deckCode)}, ${toSqlString(row.deckCode)}, ${row.orderIndex}, ${toSqlString(row.title)}, ${toSqlString(row.content)}, NULL, ${toSqlString(row.kpiMain)}, CAST(${toSqlString(JSON.stringify(row.bullets))} AS JSON), ${toSqlString(row.sourceFooter)}, ${toSqlString(row.status)}, NULL)`)
  .join(",\n");

const basePrompt = "Você é o processador de inteligência editorial do Relatório Stellar Gaming 2026. Produza conteúdo técnico, rigoroso, em português, baseado exclusivamente nas fontes fornecidas. Não invente dados; sinalize lacunas como a confirmar. Sugira alocação apenas entre os 81 slides do sumário editorial.";

const sql = `-- Seed editorial Stellar Gaming 2026: exatamente 81 slides\nDELETE FROM slideVersions;\nDELETE FROM sourceSlides;\nDELETE FROM editorialTexts;\nDELETE FROM slides;\nDELETE FROM reportSections;\nINSERT INTO reportSections (id, code, name, description, orderIndex) VALUES\n${sectionSql};\n\nINSERT INTO slides (sectionId, deckCode, orderIndex, title, content, notes, kpiMain, bullets, sourceFooter, status, lastEditedBy) VALUES\n${slideSql};\n\nINSERT INTO appConfig (\`key\`, \`value\`) VALUES\n  ('claude_model', 'claude-sonnet-4-6'),\n  ('claude_temperature', '0.2'),\n  ('claude_base_prompt', ${toSqlString(basePrompt)}),\n  ('anthropic_key', ''),\n  ('current_sumario', 'Relatório Setorial Stellar Gaming 2026 — 81 slides organizados em 10 seções.')\nON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`);\n\nSELECT COUNT(*) AS seeded_slide_count FROM slides;\n`;

fs.writeFileSync(outputPath, sql);
console.log(`Gerado ${outputPath} com ${rows.length} slides.`);
