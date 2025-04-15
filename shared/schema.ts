import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"), // user, agent, admin
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type TicketPriority = "low" | "medium" | "high" | "critical";
export type TicketStatus = "open" | "in-progress" | "on-hold" | "closed";

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: text("ticket_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("open"),
  priority: text("priority").notNull().default("medium"),
  createdById: integer("created_by_id").notNull(),
  assignedToId: integer("assigned_to_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  slaDeadline: timestamp("sla_deadline"),
});

export const insertTicketSchema = createInsertSchema(tickets).pick({
  title: true,
  description: true,
  priority: true,
  assignedToId: true,
}).extend({
  priority: z.enum(["low", "medium", "high", "critical"]),
});

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  ticketId: integer("ticket_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  ticketId: true,
});

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(), // created, updated, comment, status_change, assignment
  details: text("details"),
  ticketId: integer("ticket_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  action: true,
  details: true,
  ticketId: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
