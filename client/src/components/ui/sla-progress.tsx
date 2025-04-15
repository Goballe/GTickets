import { cn } from "@/lib/utils";
import { SlaDefinition, Ticket } from "@/lib/types";
import { calculateSla, getSlaColorClass } from "@/lib/utils/sla";

interface SlaProgressProps {
  ticket: Ticket;
  slaDefinitions: SlaDefinition[];
  className?: string;
}

export default function SlaProgress({ ticket, slaDefinitions, className }: SlaProgressProps) {
  const slaInfo = calculateSla(ticket, slaDefinitions);
  
  // If the ticket is closed, show as completed
  if (ticket.status === 'closed') {
    return (
      <div className={cn("mt-3", className)}>
        <div className="flex items-center justify-between text-xs">
          <span className="text-neutral-500">SLA: <span className="font-medium text-green-500">Completed</span></span>
          <span className="text-green-500 font-medium">100%</span>
        </div>
        <div className="mt-1 w-full bg-neutral-200 rounded-full h-1.5">
          <div className="bg-green-500 h-1.5 rounded-full w-full transition-all duration-500"></div>
        </div>
      </div>
    );
  }
  
  // Get appropriate color for the progress bar based on percentage
  const colorClass = getSlaColorClass(slaInfo.percentageRemaining);
  
  return (
    <div className={cn("mt-3", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-500">
          SLA: <span className={`font-medium ${colorClass.split(' ')[1]}`}>
            {slaInfo.displayString}
          </span>
        </span>
        <span className={`${colorClass.split(' ')[1]} font-medium`}>
          {slaInfo.percentageRemaining}%
        </span>
      </div>
      <div className="mt-1 w-full bg-neutral-200 rounded-full h-1.5">
        <div 
          className={`${colorClass.split(' ')[0]} h-1.5 rounded-full transition-all duration-500`}
          style={{ width: `${slaInfo.percentageRemaining}%` }}
        ></div>
      </div>
    </div>
  );
}
