// Import database dependencies
import { users, quizzes } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { User, InsertUser, Quiz, InsertQuiz } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Quiz methods
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  getAllQuizzes(): Promise<Quiz[]>;
  deleteQuiz(id: number): Promise<boolean>;
  updateQuiz(id: number, quiz: Partial<InsertQuiz>): Promise<Quiz | undefined>;
}

// Database storage implementation for PostgreSQL
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Quiz methods
  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const now = new Date(); // Use Date object instead of string
    
    const [quiz] = await db
      .insert(quizzes)
      .values({
        title: insertQuiz.title,
        topic: insertQuiz.topic,
        content: insertQuiz.content,
        created_at: now
      })
      .returning();
    return quiz;
  }
  
  async getQuiz(id: number): Promise<Quiz | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, id));
    return quiz || undefined;
  }
  
  async getAllQuizzes(): Promise<Quiz[]> {
    return await db.select().from(quizzes);
  }
  
  async deleteQuiz(id: number): Promise<boolean> {
    const result = await db.delete(quizzes).where(eq(quizzes.id, id));
    return !!result;
  }
  
  async updateQuiz(id: number, quizUpdates: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const [updatedQuiz] = await db
      .update(quizzes)
      .set(quizUpdates)
      .where(eq(quizzes.id, id))
      .returning();
    return updatedQuiz;
  }
}

// We'll use MemStorage temporarily while fixing database issues
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private quizzesMap: Map<number, Quiz>;
  userCurrentId: number;
  quizCurrentId: number;

  constructor() {
    this.users = new Map();
    this.quizzesMap = new Map();
    this.userCurrentId = 1;
    this.quizCurrentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Convert values() to array to avoid TypeScript iterator issues
    const allUsers = Array.from(this.users.values());
    for (const user of allUsers) {
      if (user.username === username) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = this.quizCurrentId++;
    // Use type assertion to handle the date format discrepancy
    const quiz = { 
      ...insertQuiz,
      id, 
      created_at: new Date()
    } as Quiz;
    
    this.quizzesMap.set(id, quiz);
    return quiz;
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    return this.quizzesMap.get(id);
  }

  async getAllQuizzes(): Promise<Quiz[]> {
    return Array.from(this.quizzesMap.values());
  }

  async deleteQuiz(id: number): Promise<boolean> {
    return this.quizzesMap.delete(id);
  }

  async updateQuiz(id: number, quizUpdates: Partial<InsertQuiz>): Promise<Quiz | undefined> {
    const existing = this.quizzesMap.get(id);
    if (!existing) {
      return undefined;
    }

    const updatedQuiz: Quiz = {
      ...existing,
      ...quizUpdates,
    };
    this.quizzesMap.set(id, updatedQuiz);
    return updatedQuiz;
  }
}

export const storage = new DatabaseStorage();