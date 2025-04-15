import { 
  users, type User, type InsertUser,
  tickets, type Ticket, type InsertTicket,
  comments, type Comment, type InsertComment,
  activities, type Activity, type InsertActivity,
  type TicketPriority, type TicketStatus
} from "@shared/schema";
import { nanoid } from "nanoid";

// SLA times in milliseconds based on priority
export const SLA_TIMES = {
  "low": 72 * 60 * 60 * 1000, // 72 hours
  "medium": 24 * 60 * 60 * 1000, // 24 hours
  "high": 8 * 60 * 60 * 1000, // 8 hours
  "critical": 4 * 60 * 60 * 1000, // 4 hours
};

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;

  // Ticket operations
  createTicket(ticket: InsertTicket, createdById: number): Promise<Ticket>;
  getTicket(id: number): Promise<Ticket | undefined>;
  getTicketByNumber(ticketNumber: string): Promise<Ticket | undefined>;
  getTickets(filters?: { status?: TicketStatus; priority?: TicketPriority; assignedToId?: number; createdById?: number }): Promise<Ticket[]>;
  updateTicketStatus(id: number, status: TicketStatus, userId: number): Promise<Ticket | undefined>;
  updateTicketAssignee(id: number, assignedToId: number | null, userId: number): Promise<Ticket | undefined>;
  getTicketStats(): Promise<{ open: number; inProgress: number; onHold: number; closed: number }>;

  // Comment operations
  createComment(comment: InsertComment, userId: number): Promise<Comment>;
  getCommentsByTicketId(ticketId: number): Promise<Comment[]>;

  // Activity operations
  createActivity(activity: InsertActivity, userId: number): Promise<Activity>;
  getActivitiesByTicketId(ticketId: number): Promise<Activity[]>;
  
  // Performance metrics
  getAgentPerformance(): Promise<{ userId: number; username: string; name: string; ticketsResolved: number; averageResolutionTime: number; slaComplianceRate: number }[]>;
  getPriorityPerformance(): Promise<{ priority: TicketPriority; slaComplianceRate: number }[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tickets: Map<number, Ticket>;
  private comments: Map<number, Comment>;
  private activities: Map<number, Activity>;
  private currentUserId: number;
  private currentTicketId: number;
  private currentCommentId: number;
  private currentActivityId: number;

  constructor() {
    this.users = new Map();
    this.tickets = new Map();
    this.comments = new Map();
    this.activities = new Map();
    this.currentUserId = 1;
    this.currentTicketId = 1;
    this.currentCommentId = 1;
    this.currentActivityId = 1;

    // Create default admin user
    this.createUser({
      username: "admin",
      password: "admin123",
      name: "Admin User",
      email: "admin@supportdesk.com",
      role: "admin"
    });

    // Create default agent
    this.createUser({
      username: "agent",
      password: "agent123",
      name: "Ana Martínez",
      email: "ana@supportdesk.com",
      role: "agent"
    });

    // Create default user
    this.createUser({
      username: "user",
      password: "user123",
      name: "Carlos Gómez",
      email: "carlos@example.com",
      role: "user"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Ticket operations
  async createTicket(ticket: InsertTicket, createdById: number): Promise<Ticket> {
    const id = this.currentTicketId++;
    const ticketNumber = `TK-${nanoid(4).toUpperCase()}`;
    const createdAt = new Date();
    
    // Calculate SLA deadline based on priority
    const slaDeadline = new Date(createdAt.getTime() + SLA_TIMES[ticket.priority as TicketPriority]);
    
    const newTicket: Ticket = {
      id,
      ticketNumber,
      title: ticket.title,
      description: ticket.description,
      status: "open",
      priority: ticket.priority,
      createdById,
      assignedToId: ticket.assignedToId || null,
      createdAt,
      updatedAt: createdAt,
      slaDeadline
    };
    
    this.tickets.set(id, newTicket);
    
    // Create activity for ticket creation
    this.createActivity({
      action: "created",
      details: "Ticket created",
      ticketId: id
    }, createdById);
    
    return newTicket;
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async getTicketByNumber(ticketNumber: string): Promise<Ticket | undefined> {
    return Array.from(this.tickets.values()).find(
      (ticket) => ticket.ticketNumber === ticketNumber,
    );
  }

  async getTickets(filters?: { status?: TicketStatus; priority?: TicketPriority; assignedToId?: number; createdById?: number }): Promise<Ticket[]> {
    let tickets = Array.from(this.tickets.values());
    
    if (filters) {
      if (filters.status) {
        tickets = tickets.filter(ticket => ticket.status === filters.status);
      }
      
      if (filters.priority) {
        tickets = tickets.filter(ticket => ticket.priority === filters.priority);
      }
      
      if (filters.assignedToId) {
        tickets = tickets.filter(ticket => ticket.assignedToId === filters.assignedToId);
      }
      
      if (filters.createdById) {
        tickets = tickets.filter(ticket => ticket.createdById === filters.createdById);
      }
    }
    
    // Sort by createdAt (newest first)
    tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return tickets;
  }

  async updateTicketStatus(id: number, status: TicketStatus, userId: number): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;
    
    const updatedTicket: Ticket = {
      ...ticket,
      status,
      updatedAt: new Date()
    };
    
    this.tickets.set(id, updatedTicket);
    
    // Create activity for status change
    this.createActivity({
      action: "status_change",
      details: `Status changed from ${ticket.status} to ${status}`,
      ticketId: id
    }, userId);
    
    return updatedTicket;
  }

  async updateTicketAssignee(id: number, assignedToId: number | null, userId: number): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;
    
    const updatedTicket: Ticket = {
      ...ticket,
      assignedToId,
      updatedAt: new Date()
    };
    
    this.tickets.set(id, updatedTicket);
    
    let assigneeName = "nobody";
    if (assignedToId) {
      const assignee = this.users.get(assignedToId);
      if (assignee) {
        assigneeName = assignee.name;
      }
    }
    
    // Create activity for assignment
    this.createActivity({
      action: "assignment",
      details: `Ticket assigned to ${assigneeName}`,
      ticketId: id
    }, userId);
    
    return updatedTicket;
  }

  async getTicketStats(): Promise<{ open: number; inProgress: number; onHold: number; closed: number }> {
    const tickets = Array.from(this.tickets.values());
    
    return {
      open: tickets.filter(ticket => ticket.status === "open").length,
      inProgress: tickets.filter(ticket => ticket.status === "in-progress").length,
      onHold: tickets.filter(ticket => ticket.status === "on-hold").length,
      closed: tickets.filter(ticket => ticket.status === "closed").length
    };
  }

  // Comment operations
  async createComment(comment: InsertComment, userId: number): Promise<Comment> {
    const id = this.currentCommentId++;
    const createdAt = new Date();
    
    const newComment: Comment = {
      id,
      content: comment.content,
      ticketId: comment.ticketId,
      userId,
      createdAt
    };
    
    this.comments.set(id, newComment);
    
    // Create activity for comment
    this.createActivity({
      action: "comment",
      details: "Comment added",
      ticketId: comment.ticketId
    }, userId);
    
    // Update ticket's updatedAt
    const ticket = this.tickets.get(comment.ticketId);
    if (ticket) {
      this.tickets.set(comment.ticketId, {
        ...ticket,
        updatedAt: createdAt
      });
    }
    
    return newComment;
  }

  async getCommentsByTicketId(ticketId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.ticketId === ticketId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Activity operations
  async createActivity(activity: InsertActivity, userId: number): Promise<Activity> {
    const id = this.currentActivityId++;
    const createdAt = new Date();
    
    const newActivity: Activity = {
      id,
      action: activity.action,
      details: activity.details || null,
      ticketId: activity.ticketId,
      userId,
      createdAt
    };
    
    this.activities.set(id, newActivity);
    
    return newActivity;
  }

  async getActivitiesByTicketId(ticketId: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter(activity => activity.ticketId === ticketId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Performance metrics
  async getAgentPerformance(): Promise<{ userId: number; username: string; name: string; ticketsResolved: number; averageResolutionTime: number; slaComplianceRate: number }[]> {
    const agents = Array.from(this.users.values()).filter(user => user.role === "agent");
    const tickets = Array.from(this.tickets.values());
    
    const performance = agents.map(agent => {
      const agentTickets = tickets.filter(ticket => ticket.assignedToId === agent.id);
      const resolvedTickets = agentTickets.filter(ticket => ticket.status === "closed");
      
      // Calculate average resolution time in hours
      let totalResolutionTime = 0;
      let slaCompliantCount = 0;
      
      for (const ticket of resolvedTickets) {
        const creationTime = new Date(ticket.createdAt).getTime();
        const resolutionTime = new Date(ticket.updatedAt).getTime();
        const resolutionHours = (resolutionTime - creationTime) / (1000 * 60 * 60);
        
        totalResolutionTime += resolutionHours;
        
        // Check if resolved within SLA
        if (ticket.slaDeadline && (new Date(ticket.updatedAt) <= new Date(ticket.slaDeadline))) {
          slaCompliantCount++;
        }
      }
      
      const averageResolutionTime = resolvedTickets.length > 0 ? totalResolutionTime / resolvedTickets.length : 0;
      const slaComplianceRate = resolvedTickets.length > 0 ? (slaCompliantCount / resolvedTickets.length) * 100 : 100;
      
      return {
        userId: agent.id,
        username: agent.username,
        name: agent.name,
        ticketsResolved: resolvedTickets.length,
        averageResolutionTime,
        slaComplianceRate
      };
    });
    
    return performance;
  }

  async getPriorityPerformance(): Promise<{ priority: TicketPriority; slaComplianceRate: number }[]> {
    const tickets = Array.from(this.tickets.values());
    const closedTickets = tickets.filter(ticket => ticket.status === "closed");
    
    const priorities: TicketPriority[] = ["critical", "high", "medium", "low"];
    
    const performance = priorities.map(priority => {
      const priorityTickets = closedTickets.filter(ticket => ticket.priority === priority);
      let slaCompliantCount = 0;
      
      for (const ticket of priorityTickets) {
        if (ticket.slaDeadline && (new Date(ticket.updatedAt) <= new Date(ticket.slaDeadline))) {
          slaCompliantCount++;
        }
      }
      
      const slaComplianceRate = priorityTickets.length > 0 ? (slaCompliantCount / priorityTickets.length) * 100 : 100;
      
      return {
        priority,
        slaComplianceRate
      };
    });
    
    return performance;
  }
}

import session from "express-session";
import { DatabaseStorage } from "./database-storage";

// Actualizar la interfaz IStorage para incluir sessionStore
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;

  // Ticket operations
  createTicket(ticket: InsertTicket, createdById: number): Promise<Ticket>;
  getTicket(id: number): Promise<Ticket | undefined>;
  getTicketByNumber(ticketNumber: string): Promise<Ticket | undefined>;
  getTickets(filters?: { status?: TicketStatus; priority?: TicketPriority; assignedToId?: number; createdById?: number }): Promise<Ticket[]>;
  updateTicketStatus(id: number, status: TicketStatus, userId: number): Promise<Ticket | undefined>;
  updateTicketAssignee(id: number, assignedToId: number | null, userId: number): Promise<Ticket | undefined>;
  getTicketStats(): Promise<{ open: number; inProgress: number; onHold: number; closed: number }>;

  // Comment operations
  createComment(comment: InsertComment, userId: number): Promise<Comment>;
  getCommentsByTicketId(ticketId: number): Promise<Comment[]>;

  // Activity operations
  createActivity(activity: InsertActivity, userId: number): Promise<Activity>;
  getActivitiesByTicketId(ticketId: number): Promise<Activity[]>;
  
  // Performance metrics
  getAgentPerformance(): Promise<{ userId: number; username: string; name: string; ticketsResolved: number; averageResolutionTime: number; slaComplianceRate: number }[]>;
  getPriorityPerformance(): Promise<{ priority: TicketPriority; slaComplianceRate: number }[]>;
  
  // Session store (para PostgreSQL)
  sessionStore?: any;
}

// Usar PostgreSQL en producción y memoria en desarrollo
const isProduction = process.env.NODE_ENV === 'production';

// Si estamos en producción o tenemos una URL de base de datos, usar PostgreSQL
export const storage = process.env.DATABASE_URL || isProduction 
  ? new DatabaseStorage() 
  : new MemStorage();
