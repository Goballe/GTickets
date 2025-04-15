import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { Ticket, User } from "@/lib/types";
import { TICKET_STATUS, TICKET_PRIORITY } from "@/lib/constants";
import { formatTimeAgo, getSlaInfo } from "@/lib/utils";

interface TicketCardProps {
  ticket: Ticket;
  createdBy: User;
  onViewDetails: (ticketId: number) => void;
}

export function TicketCard({ ticket, createdBy, onViewDetails }: TicketCardProps) {
  const statusInfo = TICKET_STATUS[ticket.status];
  const priorityInfo = TICKET_PRIORITY[ticket.priority];
  const slaInfo = getSlaInfo(ticket.slaDeadline, ticket.status);
  
  return (
    <div className={`ticket-card bg-white border-l-4 ${priorityInfo.borderColor} rounded-lg shadow-sm p-4 hover:shadow-md flex flex-col md:flex-row`}>
      <div className="flex-1">
        <div className="flex items-start">
          <div className="flex-1">
            <h4 className="font-medium text-neutral-800">{ticket.title}</h4>
            <p className="text-sm text-neutral-500 mt-1">
              #{ticket.ticketNumber} • Creado {formatTimeAgo(ticket.createdAt)} por <span className="text-primary">{createdBy.name}</span>
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            <span className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${priorityInfo.bgColor} ${priorityInfo.color}`}>
              {priorityInfo.label}
            </span>
          </div>
        </div>
        <p className="mt-2 text-sm text-neutral-600">{ticket.description}</p>
        
        {/* SLA Indicator */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500">SLA: <span className={`font-medium ${slaInfo.color}`}>{slaInfo.timeLeft}</span></span>
            <span className={`${slaInfo.color} font-medium`}>{slaInfo.percentage}%</span>
          </div>
          <div className="mt-1 w-full bg-neutral-200 rounded-full h-1.5">
            <div className={`sla-indicator ${slaInfo.progressColor} h-1.5 rounded-full`} style={{width: `${slaInfo.percentage}%`}}></div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 md:mt-0 md:ml-4 md:flex md:items-center md:justify-center">
        <Button 
          className="w-full md:w-auto flex items-center justify-center"
          onClick={() => onViewDetails(ticket.id)}
        >
          <Eye className="mr-2 h-4 w-4" />
          <span>Ver detalles</span>
        </Button>
      </div>
    </div>
  );
}
