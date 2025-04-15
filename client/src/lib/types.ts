export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: "user" | "agent" | "admin";
}

export type TicketPriority = "low" | "medium" | "high" | "critical";
export type TicketStatus = "open" | "in-progress" | "on-hold" | "closed";

export interface Ticket {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdById: number;
  assignedToId: number | null;
  createdAt: string;
  updatedAt: string;
  slaDeadline: string | null;
}

export interface Comment {
  id: number;
  content: string;
  ticketId: number;
  userId: number;
  createdAt: string;
}

export interface Activity {
  id: number;
  action: "created" | "updated" | "comment" | "status_change" | "assignment";
  details: string | null;
  ticketId: number;
  userId: number;
  createdAt: string;
}

export interface TicketWithUser extends Ticket {
  createdBy?: User;
  assignedTo?: User;
}

export interface CommentWithUser extends Comment {
  user?: User;
}

export interface ActivityWithUser extends Activity {
  user?: User;
}

export interface TicketStats {
  open: number;
  inProgress: number;
  onHold: number;
  closed: number;
}

export interface AgentPerformance {
  userId: number;
  username: string;
  name: string;
  ticketsResolved: number;
  averageResolutionTime: number;
  slaComplianceRate: number;
}

export interface PriorityPerformance {
  priority: TicketPriority;
  slaComplianceRate: number;
}
