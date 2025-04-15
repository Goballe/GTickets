import { db } from "./db";
import { eq, and, desc, isNull } from "drizzle-orm";
import { 
  users, tickets, comments, activities,
  type User, type InsertUser,
  type Ticket, type InsertTicket, 
  type Comment, type InsertComment,
  type Activity, type InsertActivity,
  type TicketStatus, type TicketPriority
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { IStorage } from "./storage";
import { SLA_TIMES } from "./storage";
import { nanoid } from "nanoid";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool: db.$client,
      createTableIfMissing: true,
    });
    
    // Inicializar usuarios por defecto si no existen
    this.initDefaultUsers();
  }

  private async initDefaultUsers() {
    // Verificar si ya existen usuarios
    const existingUsers = await db.select().from(users);
    if (existingUsers.length === 0) {
      // Crear usuarios por defecto
      await db.insert(users).values([
        {
          username: "admin",
          password: "admin123",
          name: "Admin User",
          email: "admin@supportdesk.com",
          role: "admin"
        },
        {
          username: "agent",
          password: "agent123",
          name: "Ana Martínez",
          email: "ana@supportdesk.com",
          role: "agent"
        },
        {
          username: "user",
          password: "user123",
          name: "Carlos Gómez",
          email: "carlos@example.com",
          role: "user"
        }
      ]);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createTicket(ticket: InsertTicket, createdById: number): Promise<Ticket> {
    const ticketNumber = `TK-${nanoid(4).toUpperCase()}`;
    const createdAt = new Date();
    
    // Calcular la fecha límite del SLA basada en la prioridad
    const slaDeadline = new Date(createdAt.getTime() + SLA_TIMES[ticket.priority as TicketPriority]);
    
    const [newTicket] = await db.insert(tickets).values({
      ...ticket,
      ticketNumber,
      status: "open",
      createdById,
      assignedToId: ticket.assignedToId || null,
      createdAt,
      updatedAt: createdAt,
      slaDeadline
    }).returning();
    
    // Crear actividad para el nuevo ticket
    await this.createActivity({
      action: "created",
      details: "Ticket created",
      ticketId: newTicket.id,
    }, createdById);
    
    return newTicket;
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket;
  }

  async getTicketByNumber(ticketNumber: string): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.ticketNumber, ticketNumber));
    return ticket;
  }

  async getTickets(filters?: { status?: TicketStatus; priority?: TicketPriority; assignedToId?: number; createdById?: number }): Promise<Ticket[]> {
    let query = db.select().from(tickets);
    
    if (filters) {
      const conditions = [];
      
      if (filters.status) {
        conditions.push(eq(tickets.status, filters.status));
      }
      
      if (filters.priority) {
        conditions.push(eq(tickets.priority, filters.priority));
      }
      
      if (filters.assignedToId !== undefined) {
        if (filters.assignedToId === null) {
          conditions.push(isNull(tickets.assignedToId));
        } else {
          conditions.push(eq(tickets.assignedToId, filters.assignedToId));
        }
      }
      
      if (filters.createdById !== undefined) {
        conditions.push(eq(tickets.createdById, filters.createdById));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(tickets.createdAt));
  }

  async updateTicketStatus(id: number, status: TicketStatus, userId: number): Promise<Ticket | undefined> {
    const now = new Date();
    
    const [updatedTicket] = await db.update(tickets)
      .set({ status, updatedAt: now })
      .where(eq(tickets.id, id))
      .returning();
    
    if (!updatedTicket) return undefined;
    
    // Crear actividad para el cambio de estado
    await this.createActivity({
      action: "status_change",
      details: `Status changed from ${updatedTicket.status} to ${status}`,
      ticketId: id,
    }, userId);
    
    return updatedTicket;
  }

  async updateTicketAssignee(id: number, assignedToId: number | null, userId: number): Promise<Ticket | undefined> {
    const now = new Date();
    
    const [updatedTicket] = await db.update(tickets)
      .set({ assignedToId, updatedAt: now })
      .where(eq(tickets.id, id))
      .returning();
    
    if (!updatedTicket) return undefined;
    
    // Crear actividad para la asignación
    let assigneeName = "nobody";
    if (assignedToId) {
      const assignee = await this.getUser(assignedToId);
      if (assignee) {
        assigneeName = assignee.name;
      }
    }
    
    await this.createActivity({
      action: "assignment",
      details: `Ticket assigned to ${assigneeName}`,
      ticketId: id,
    }, userId);
    
    return updatedTicket;
  }

  async getTicketStats(): Promise<{ open: number; inProgress: number; onHold: number; closed: number }> {
    const openCount = await db.select().from(tickets).where(eq(tickets.status, "open"));
    const inProgressCount = await db.select().from(tickets).where(eq(tickets.status, "in-progress"));
    const onHoldCount = await db.select().from(tickets).where(eq(tickets.status, "on-hold"));
    const closedCount = await db.select().from(tickets).where(eq(tickets.status, "closed"));
    
    return {
      open: openCount.length,
      inProgress: inProgressCount.length,
      onHold: onHoldCount.length,
      closed: closedCount.length
    };
  }

  async createComment(comment: InsertComment, userId: number): Promise<Comment> {
    const createdAt = new Date();
    
    const [newComment] = await db.insert(comments)
      .values({ ...comment, userId, createdAt })
      .returning();
    
    // Crear actividad para el comentario
    await this.createActivity({
      action: "comment",
      details: "Comment added",
      ticketId: comment.ticketId,
    }, userId);
    
    // Actualizar el campo updatedAt del ticket
    await db.update(tickets)
      .set({ updatedAt: createdAt })
      .where(eq(tickets.id, comment.ticketId));
    
    return newComment;
  }

  async getCommentsByTicketId(ticketId: number): Promise<Comment[]> {
    return await db.select()
      .from(comments)
      .where(eq(comments.ticketId, ticketId))
      .orderBy(desc(comments.createdAt));
  }

  async createActivity(activity: InsertActivity, userId: number): Promise<Activity> {
    const createdAt = new Date();
    
    const [newActivity] = await db.insert(activities)
      .values({ ...activity, userId, createdAt })
      .returning();
    
    return newActivity;
  }

  async getActivitiesByTicketId(ticketId: number): Promise<Activity[]> {
    return await db.select()
      .from(activities)
      .where(eq(activities.ticketId, ticketId))
      .orderBy(desc(activities.createdAt));
  }
  
  async getAgentPerformance(): Promise<{ userId: number; username: string; name: string; ticketsResolved: number; averageResolutionTime: number; slaComplianceRate: number }[]> {
    // Obtener todos los usuarios con rol de agente o admin
    const agentsResult = await db.select().from(users).where(
      eq(users.role, "agent")
    );
    
    const result = [];
    
    for (const agent of agentsResult) {
      // Tickets resueltos por este agente
      const agentTickets = await db.select().from(tickets).where(
        and(
          eq(tickets.status, "closed"),
          eq(tickets.assignedToId, agent.id)
        )
      );
      
      // Calcular tiempo promedio de resolución (en horas)
      let totalResolutionTime = 0;
      let ticketsWithValidTimes = 0;
      let ticketsWithinSla = 0;
      
      agentTickets.forEach(ticket => {
        const createdAt = new Date(ticket.createdAt);
        const updatedAt = new Date(ticket.updatedAt);
        const resolutionTime = (updatedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60); // en horas
        
        if (!isNaN(resolutionTime)) {
          totalResolutionTime += resolutionTime;
          ticketsWithValidTimes++;
        }
        
        if (ticket.slaDeadline) {
          const slaDeadline = new Date(ticket.slaDeadline);
          if (updatedAt <= slaDeadline) {
            ticketsWithinSla++;
          }
        }
      });
      
      const averageResolutionTime = ticketsWithValidTimes > 0 
        ? Math.round((totalResolutionTime / ticketsWithValidTimes) * 10) / 10
        : 0;
      
      const slaComplianceRate = agentTickets.length > 0
        ? Math.round((ticketsWithinSla / agentTickets.length) * 100)
        : 100;
      
      result.push({
        userId: agent.id,
        username: agent.username,
        name: agent.name,
        ticketsResolved: agentTickets.length,
        averageResolutionTime,
        slaComplianceRate
      });
    }
    
    return result;
  }
  
  async getPriorityPerformance(): Promise<{ priority: TicketPriority; slaComplianceRate: number }[]> {
    const priorities: TicketPriority[] = ["low", "medium", "high", "critical"];
    const result = [];
    
    for (const priority of priorities) {
      // Obtener todos los tickets cerrados con esta prioridad
      const priorityTickets = await db.select().from(tickets).where(
        and(
          eq(tickets.priority, priority),
          eq(tickets.status, "closed")
        )
      );
      
      // Calcular tasa de cumplimiento de SLA
      let ticketsWithinSla = 0;
      
      priorityTickets.forEach(ticket => {
        if (!ticket.slaDeadline) return;
        
        const slaDeadline = new Date(ticket.slaDeadline);
        const updatedAt = new Date(ticket.updatedAt);
        
        if (updatedAt <= slaDeadline) {
          ticketsWithinSla++;
        }
      });
      
      const slaComplianceRate = priorityTickets.length > 0
        ? Math.round((ticketsWithinSla / priorityTickets.length) * 100)
        : 100;
      
      result.push({
        priority,
        slaComplianceRate
      });
    }
    
    return result;
  }
}