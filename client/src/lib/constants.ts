export const TICKET_STATUS = {
  "open": {
    label: "Abierto",
    color: "text-status-open",
    bgColor: "bg-status-open/10"
  },
  "in-progress": {
    label: "En proceso",
    color: "text-status-progress",
    bgColor: "bg-status-progress/10"
  },
  "on-hold": {
    label: "En espera",
    color: "text-status-hold",
    bgColor: "bg-status-hold/10"
  },
  "closed": {
    label: "Cerrado",
    color: "text-status-closed",
    bgColor: "bg-status-closed/10"
  }
};

export const TICKET_PRIORITY = {
  "low": {
    label: "Baja",
    color: "text-priority-low",
    bgColor: "bg-priority-low/10",
    borderColor: "border-priority-low",
    slaHours: 72
  },
  "medium": {
    label: "Media",
    color: "text-priority-medium",
    bgColor: "bg-priority-medium/10",
    borderColor: "border-priority-medium",
    slaHours: 24
  },
  "high": {
    label: "Alta",
    color: "text-priority-high",
    bgColor: "bg-priority-high/10",
    borderColor: "border-priority-high",
    slaHours: 8
  },
  "critical": {
    label: "Crítica",
    color: "text-priority-critical",
    bgColor: "bg-priority-critical/10",
    borderColor: "border-priority-critical",
    slaHours: 4
  }
};

export const ACTIVITY_ICONS = {
  "created": "mdi-ticket",
  "updated": "mdi-pencil",
  "comment": "mdi-comment-text-outline",
  "status_change": "mdi-sync",
  "assignment": "mdi-account-arrow-right"
};

export const ACTIVITY_COLORS = {
  "created": "bg-status-open",
  "updated": "bg-neutral-400",
  "comment": "bg-primary",
  "status_change": "bg-status-progress",
  "assignment": "bg-neutral-400"
};
