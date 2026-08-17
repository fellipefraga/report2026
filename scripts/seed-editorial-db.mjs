import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const seedSql = await fs.readFile("drizzle/seed_stellar_81.sql", "utf8");

function splitStatements(sql) {
  const statements = [];
  let start = 0;
  let inString = false;
  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index];
    if (char === "'") {
      if (inString && sql[index + 1] === "'") {
        index += 1;
        continue;
      }
      inString = !inString;
    }
    if (char === ";" && !inString) {
      const statement = sql.slice(start, index).trim();
      if (statement && !statement.startsWith("--")) statements.push(statement);
      if (statement.startsWith("--")) {
        const withoutComment = statement.replace(/^--[^\n]*\n/, "").trim();
        if (withoutComment) statements.push(withoutComment);
      }
      start = index + 1;
    }
  }
  return statements;
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não está disponível para realizar o seed.");
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  await connection.beginTransaction();
  for (const statement of splitStatements(seedSql)) {
    if (statement.startsWith("SELECT COUNT")) continue;
    await connection.query(statement);
  }
  const [result] = await connection.query("SELECT COUNT(*) AS total FROM slides");
  const total = result[0]?.total;
  if (total !== 81) throw new Error(`Seed inválido: esperados 81 slides, recebidos ${total}.`);
  await connection.commit();
  console.log(`Seed editorial concluído com ${total} slides.`);
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  await connection.end();
}
