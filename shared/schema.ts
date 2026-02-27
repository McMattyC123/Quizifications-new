import { pgTable, serial, varchar, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  password_hash: varchar("password_hash", { length: 255 }),
  display_name: varchar("display_name", { length: 255 }).notNull(),
  auth_provider: varchar("auth_provider", { length: 50 }).notNull().default("email"),
  auth_provider_id: varchar("auth_provider_id", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  push_token: varchar("push_token", { length: 255 }),
  trial_start: timestamp("trial_start").defaultNow(),
  is_premium: boolean("is_premium").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  created_at: timestamp("created_at").defaultNow(),
});

export const noteQuestions = pgTable("note_questions", {
  id: serial("id").primaryKey(),
  note_id: integer("note_id").notNull().references(() => notes.id),
  question: text("question").notNull(),
  option_a: varchar("option_a", { length: 500 }).notNull(),
  option_b: varchar("option_b", { length: 500 }).notNull(),
  option_c: varchar("option_c", { length: 500 }).notNull(),
  option_d: varchar("option_d", { length: 500 }).notNull(),
  correct_answer: varchar("correct_answer", { length: 500 }).notNull(),
  times_shown: integer("times_shown").default(0),
  times_correct: integer("times_correct").default(0),
  created_at: timestamp("created_at").defaultNow(),
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id),
  question_id: integer("question_id").notNull().references(() => noteQuestions.id),
  selected_answer: varchar("selected_answer", { length: 500 }).notNull(),
  is_correct: boolean("is_correct").notNull(),
  answered_at: timestamp("answered_at").defaultNow(),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").notNull().references(() => users.id).unique(),
  notifications_enabled: boolean("notifications_enabled").default(true),
  quiz_frequency: integer("quiz_frequency").default(3),
  quiz_interval_minutes: integer("quiz_interval_minutes").default(10),
  quiet_hours_start: varchar("quiet_hours_start", { length: 10 }).default("22:00"),
  quiet_hours_end: varchar("quiet_hours_end", { length: 10 }).default("08:00"),
  last_notification_at: timestamp("last_notification_at"),
  last_notification_question_id: integer("last_notification_question_id"),
  last_notification_answered: boolean("last_notification_answered").default(true),
  consecutive_ignores: integer("consecutive_ignores").default(0),
  snoozed_until: timestamp("snoozed_until"),
});
