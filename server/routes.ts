import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTicketSchema, insertCommentSchema } from "@shared/schema";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up session store
  const MemoryStoreInstance = MemoryStore(session);
  app.use(session({
    secret: "support-ticket-system-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
    store: new MemoryStoreInstance({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));
  
  // Set up passport for authentication
  app.use(passport.initialize());
  app.use(passport.session());
  
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }
      if (user.password !== password) {
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
  
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  
  // Authentication middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };
  
  // Role-based access middleware
  const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: Function) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as any;
      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      next();
    };
  };
  
  // Authentication routes
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({ user: req.user });
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ user: req.user });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });
  
  // User routes
  app.get("/api/users", requireAuth, requireRole(["admin", "agent"]), async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.post("/api/users", requireAuth, requireRole(["admin"]), async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data", error });
    }
  });
  
  // Ticket routes
  app.get("/api/tickets", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Apply filters
      const filters: any = {};
      
      if (req.query.status) {
        filters.status = req.query.status as string;
      }
      
      if (req.query.priority) {
        filters.priority = req.query.priority as string;
      }
      
      // If user is not admin or agent, only show their tickets
      if (user.role === "user") {
        filters.createdById = user.id;
      }
      
      // If assignedTo filter is specified and user is admin or agent
      if (req.query.assignedTo && (user.role === "admin" || user.role === "agent")) {
        filters.assignedToId = parseInt(req.query.assignedTo as string);
      }
      
      const tickets = await storage.getTickets(filters);
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });
  
  app.get("/api/tickets/stats", requireAuth, requireRole(["admin", "agent"]), async (req, res) => {
    try {
      const stats = await storage.getTicketStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ticket stats" });
    }
  });
  
  app.get("/api/tickets/:id", requireAuth, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const ticket = await storage.getTicket(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const user = req.user as any;
      
      // If user is not admin or agent, check if they created the ticket
      if (user.role === "user" && ticket.createdById !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ticket" });
    }
  });
  
  app.post("/api/tickets", requireAuth, async (req, res) => {
    try {
      const validatedData = insertTicketSchema.parse(req.body);
      const user = req.user as any;
      
      const ticket = await storage.createTicket(validatedData, user.id);
      res.status(201).json(ticket);
    } catch (error) {
      res.status(400).json({ message: "Invalid ticket data", error });
    }
  });
  
  app.patch("/api/tickets/:id/status", requireAuth, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !["open", "in-progress", "on-hold", "closed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const user = req.user as any;
      const ticket = await storage.getTicket(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Only admin, agent, or the creator can update status
      if (user.role === "user" && ticket.createdById !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedTicket = await storage.updateTicketStatus(ticketId, status, user.id);
      res.json(updatedTicket);
    } catch (error) {
      res.status(500).json({ message: "Failed to update ticket status" });
    }
  });
  
  app.patch("/api/tickets/:id/assign", requireAuth, requireRole(["admin", "agent"]), async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { assignedToId } = req.body;
      
      const user = req.user as any;
      const parsedAssigneeId = assignedToId ? parseInt(assignedToId) : null;
      
      // If assignee is specified, verify it's a valid user
      if (parsedAssigneeId) {
        const assignee = await storage.getUser(parsedAssigneeId);
        if (!assignee) {
          return res.status(400).json({ message: "Invalid assignee" });
        }
      }
      
      const updatedTicket = await storage.updateTicketAssignee(ticketId, parsedAssigneeId, user.id);
      
      if (!updatedTicket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(updatedTicket);
    } catch (error) {
      res.status(500).json({ message: "Failed to update ticket assignee" });
    }
  });
  
  // Comment routes
  app.get("/api/tickets/:id/comments", requireAuth, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const ticket = await storage.getTicket(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const user = req.user as any;
      
      // If user is not admin or agent, check if they created the ticket
      if (user.role === "user" && ticket.createdById !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const comments = await storage.getCommentsByTicketId(ticketId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });
  
  app.post("/api/tickets/:id/comments", requireAuth, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const ticket = await storage.getTicket(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const user = req.user as any;
      
      // If user is not admin or agent, check if they created the ticket
      if (user.role === "user" && ticket.createdById !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const validatedData = insertCommentSchema.parse({
        content: req.body.content,
        ticketId
      });
      
      const comment = await storage.createComment(validatedData, user.id);
      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ message: "Invalid comment data", error });
    }
  });
  
  // Activity routes
  app.get("/api/tickets/:id/activities", requireAuth, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const ticket = await storage.getTicket(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      const user = req.user as any;
      
      // If user is not admin or agent, check if they created the ticket
      if (user.role === "user" && ticket.createdById !== user.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const activities = await storage.getActivitiesByTicketId(ticketId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });
  
  // Performance metrics routes
  app.get("/api/performance/agents", requireAuth, requireRole(["admin", "agent"]), async (req, res) => {
    try {
      const agentPerformance = await storage.getAgentPerformance();
      res.json(agentPerformance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch agent performance" });
    }
  });
  
  app.get("/api/performance/priorities", requireAuth, requireRole(["admin", "agent"]), async (req, res) => {
    try {
      const priorityPerformance = await storage.getPriorityPerformance();
      res.json(priorityPerformance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch priority performance" });
    }
  });
  
  return httpServer;
}
