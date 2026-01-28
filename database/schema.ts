import {
  pgTable,
  text,
  timestamp,
  boolean,
  uuid,
  json,
  customType,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Custom vector type for pgvector extension
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
});

// Define role enum
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const messageRoleEnum = pgEnum("message_role", [
  "user",
  "assistant",
  "system",
]);
export const thumbEnum = pgEnum("thumb", ["up", "down"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique().notNull(),
  name: text("name"),
  image: text("image"),
  emailVerified: timestamp("email_verified"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  password: text("password"),
  role: text("role").default("user").notNull(),
});

// User Files table
export const userFiles = pgTable("user_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  storagePath: text("storage_path").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Prompts table
export const prompts = pgTable("prompts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(false),
  name: text("name"),
});

// Conversations table
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").default("New Chat"),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  userFileId: uuid("user_file_id").references(() => userFiles.id, {
    onDelete: "cascade",
  }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  sources: json("sources"),
});

// KB Access table
export const kbAccess = pgTable("kb_accesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .unique()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  hasAccessToDefaultKB: boolean("has_access_to_default_kb").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Documents table with vector embedding
export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    metadata: json("metadata"),
    embedding: vector("embedding").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    fileId: uuid("file_id").references(() => userFiles.id, {
      onDelete: "cascade",
    }),
  },
  (table) => ({
    // HNSW index for fast approximate nearest neighbor search with cosine distance
    embeddingIdx: index("documents_embedding_idx").using(
      "hnsw",
      table.embedding.asc().op("vector_cosine_ops"),
    ),
  }),
);

// Feedback table
export const feedbacks = pgTable("feedbacks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  convMsgId: text("conv_msg_id").notNull(),
  aiResponse: text("ai_response").notNull(),
  userQuery: text("user_query"),
  thumb: text("thumb").default("up").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define all relations
export const usersRelations = relations(users, ({ one, many }) => ({
  files: many(userFiles),
  prompts: many(prompts),
  conversations: many(conversations),
  kbAccess: one(kbAccess, {
    fields: [users.id],
    references: [kbAccess.userId],
  }),
  messages: many(messages),
  documents: many(documents),
  feedbacks: many(feedbacks),
}));

export const userFilesRelations = relations(userFiles, ({ one, many }) => ({
  user: one(users, {
    fields: [userFiles.userId],
    references: [users.id],
  }),
  messages: many(messages),
  documents: many(documents),
}));

export const promptsRelations = relations(prompts, ({ one }) => ({
  user: one(users, {
    fields: [prompts.userId],
    references: [users.id],
  }),
}));

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [conversations.userId],
      references: [users.id],
    }),
    messages: many(messages),
    feedbacks: many(feedbacks),
  }),
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
  userFile: one(userFiles, {
    fields: [messages.userFileId],
    references: [userFiles.id],
  }),
}));

export const kbAccessRelations = relations(kbAccess, ({ one }) => ({
  user: one(users, {
    fields: [kbAccess.userId],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  file: one(userFiles, {
    fields: [documents.fileId],
    references: [userFiles.id],
  }),
}));

export const feedbacksRelations = relations(feedbacks, ({ one }) => ({
  user: one(users, {
    fields: [feedbacks.userId],
    references: [users.id],
  }),
  conversation: one(conversations, {
    fields: [feedbacks.conversationId],
    references: [conversations.id],
  }),
}));

// Export types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UserFile = typeof userFiles.$inferSelect;
export type NewUserFile = typeof userFiles.$inferInsert;

export type Prompt = typeof prompts.$inferSelect;
export type NewPrompt = typeof prompts.$inferInsert;

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type KBAccess = typeof kbAccess.$inferSelect;
export type NewKBAccess = typeof kbAccess.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type Feedback = typeof feedbacks.$inferSelect;
export type NewFeedback = typeof feedbacks.$inferInsert;
