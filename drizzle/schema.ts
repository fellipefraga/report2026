import {
  boolean,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const sourceTypeValues = ["url", "text", "upload"] as const;
export const sourceStatusValues = ["pending", "processing", "done", "error"] as const;
export const slideStatusValues = ["draft", "review", "approved"] as const;
export const textStatusValues = ["draft", "review", "approved"] as const;

export const sources = mysqlTable("sources", {
  id: int("id").autoincrement().primaryKey(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
  inputType: mysqlEnum("inputType", sourceTypeValues).notNull(),
  inputText: text("inputText"),
  sourceUrl: text("sourceUrl"),
  fileName: varchar("fileName", { length: 512 }),
  fileMimeType: varchar("fileMimeType", { length: 160 }),
  storageKey: varchar("storageKey", { length: 512 }),
  title: varchar("title", { length: 320 }),
  classification: json("classification").$type<{
    tema?: string;
    secoes?: string[];
    confiabilidade?: "alta" | "media" | "baixa";
    resumo?: string;
  }>(),
  extractedInsights: json("extractedInsights").$type<string[]>(),
  suggestedSlideCodes: json("suggestedSlideCodes").$type<string[]>(),
  processingStatus: mysqlEnum("processingStatus", sourceStatusValues).default("pending").notNull(),
  processingError: text("processingError"),
});

export const reportSections = mysqlTable("reportSections", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 16 }).notNull(),
  name: varchar("name", { length: 180 }).notNull(),
  description: text("description"),
  orderIndex: int("orderIndex").notNull(),
}, table => [uniqueIndex("reportSections_code_unique").on(table.code)]);

export const slides = mysqlTable("slides", {
  id: int("id").autoincrement().primaryKey(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  sectionId: int("sectionId").references(() => reportSections.id, { onDelete: "set null" }),
  deckCode: varchar("deckCode", { length: 24 }).notNull(),
  orderIndex: int("orderIndex").notNull(),
  title: varchar("title", { length: 320 }).notNull(),
  content: text("content").notNull(),
  notes: text("notes"),
  kpiMain: varchar("kpiMain", { length: 320 }),
  bullets: json("bullets").$type<string[]>().notNull(),
  sourceFooter: text("sourceFooter"),
  status: mysqlEnum("status", slideStatusValues).default("draft").notNull(),
  lastEditedBy: int("lastEditedBy").references(() => users.id, { onDelete: "set null" }),
}, table => [
  uniqueIndex("slides_deckCode_unique").on(table.deckCode),
  uniqueIndex("slides_orderIndex_unique").on(table.orderIndex),
]);

export const sourceSlides = mysqlTable("sourceSlides", {
  id: int("id").autoincrement().primaryKey(),
  sourceId: int("sourceId").notNull().references(() => sources.id, { onDelete: "cascade" }),
  slideId: int("slideId").notNull().references(() => slides.id, { onDelete: "cascade" }),
  relevanceNote: text("relevanceNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("sourceSlides_unique_link").on(table.sourceId, table.slideId)]);

export const slideVersions = mysqlTable("slideVersions", {
  id: int("id").autoincrement().primaryKey(),
  slideId: int("slideId").notNull().references(() => slides.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
  versionNumber: int("versionNumber").notNull(),
  title: varchar("title", { length: 320 }).notNull(),
  content: text("content").notNull(),
  notes: text("notes"),
  kpiMain: varchar("kpiMain", { length: 320 }),
  bullets: json("bullets").$type<string[]>().notNull(),
  sourceFooter: text("sourceFooter"),
  status: mysqlEnum("status", slideStatusValues).notNull(),
}, table => [uniqueIndex("slideVersions_slide_version_unique").on(table.slideId, table.versionNumber)]);

export const editorialTexts = mysqlTable("editorialTexts", {
  id: int("id").autoincrement().primaryKey(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  sourceId: int("sourceId").references(() => sources.id, { onDelete: "set null" }),
  slideId: int("slideId").references(() => slides.id, { onDelete: "set null" }),
  bloco: varchar("bloco", { length: 160 }).notNull(),
  content: text("content").notNull(),
  status: mysqlEnum("status", textStatusValues).default("draft").notNull(),
});

export const appConfig = mysqlTable("appConfig", {
  key: varchar("key", { length: 120 }).primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const exportHistory = mysqlTable("exportHistory", {
  id: int("id").autoincrement().primaryKey(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
  format: mysqlEnum("format", ["json", "markdown"]).notNull(),
  scope: mysqlEnum("scope", ["approved", "all"]).default("approved").notNull(),
  slideCount: int("slideCount").notNull(),
  generatedContent: text("generatedContent").notNull(),
});

export const teamAccess = mysqlTable("teamAccess", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [uniqueIndex("teamAccess_email_unique").on(table.email)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Source = typeof sources.$inferSelect;
export type Slide = typeof slides.$inferSelect;
export type SlideVersion = typeof slideVersions.$inferSelect;
