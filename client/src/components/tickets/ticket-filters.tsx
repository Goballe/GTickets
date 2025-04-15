import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { TICKET_STATUS, TICKET_PRIORITY } from "@/lib/constants";

interface TicketFiltersProps {
  filters: {
    status: string;
    priority: string;
  };
  onFilterChange: (filters: { status: string; priority: string }) => void;
}

export function TicketFilters({ filters, onFilterChange }: TicketFiltersProps) {
  const handleStatusChange = (value: string) => {
    onFilterChange({
      ...filters,
      status: value
    });
  };
  
  const handlePriorityChange = (value: string) => {
    onFilterChange({
      ...filters,
      priority: value
    });
  };
  
  return (
    <div className="flex mt-4 md:mt-0 space-x-2">
      <Select
        value={filters.status}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todos los estados" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          {Object.entries(TICKET_STATUS).map(([key, { label }]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select
        value={filters.priority}
        onValueChange={handlePriorityChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Todas las prioridades" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las prioridades</SelectItem>
          {Object.entries(TICKET_PRIORITY).map(([key, { label }]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
