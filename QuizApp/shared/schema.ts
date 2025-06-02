import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define database schema with standard PostgreSQL types that work across all environments

// User schema (kept from the original file)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Quiz schema for storing quizzes
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  content: jsonb("content").notNull(),
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  created_at: true,
});

export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

// Question types and shared schemas
export const quizQuestionSchema = z.object({
  id: z.number(),
  type: z.enum(["true_false", "mcq"]),
  question: z.string(),
  correct_answer: z.string(),
});

export const truefalseQuestionSchema = quizQuestionSchema.extend({
  type: z.literal("true_false"),
  correct_answer: z.enum(["True", "False"]),
});

export const mcqQuestionSchema = quizQuestionSchema.extend({
  type: z.literal("mcq"),
  options: z.record(z.string(), z.string()),
  correct_answer: z.string(),
});

export const quizContentSchema = z.object({
  topic: z.string(),
  questions: z.array(z.union([truefalseQuestionSchema, mcqQuestionSchema])),
});

export type QuizContent = z.infer<typeof quizContentSchema>;
export type TrueFalseQuestion = z.infer<typeof truefalseQuestionSchema>;
export type MCQQuestion = z.infer<typeof mcqQuestionSchema>;
export type QuizQuestion = TrueFalseQuestion | MCQQuestion;
