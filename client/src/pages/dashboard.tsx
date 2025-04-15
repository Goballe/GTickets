import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { TicketList } from "@/components/tickets/ticket-list";
import { CreateTicketModal } from "@/components/tickets/create-ticket-modal";
import { PerformanceByPriority } from "@/components/dashboard/performance-by-priority";
import { AgentPerformanceList } from "@/components/dashboard/agent-performance";
import { User, TicketStats, Ticket as TicketType } from "@/lib/types";
import { Ticket, Clock, PauseCircle, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TICKET_STATUS, TICKET_PRIORITY } from "@/lib/constants";

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Fetch ticket stats para admin/agentes
  const { data: stats, isLoading: isLoadingStats } = useQuery<TicketStats>({
    queryKey: ["/api/tickets/stats"],
    queryFn: async () => {
      const response = await fetch("/api/tickets/stats");
      if (!response.ok) throw new Error("Failed to fetch ticket stats");
      return response.json();
    },
    // Only fetch if user is admin or agent
    enabled: user.role === "admin" || user.role === "agent"
  });
  
  // Fetch tickets del usuario (para usuarios normales)
  const { data: userTickets = [], isLoading: isLoadingUserTickets } = useQuery<TicketType[]>({
    queryKey: ["/api/tickets", "user"],
    queryFn: async () => {
      const response = await fetch(`/api/tickets?createdById=${user.id}`);
      if (!response.ok) throw new Error("Failed to fetch user tickets");
      return response.json();
    },
    // Only fetch if user is a regular user
    enabled: user.role === "user"
  });
  
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };
  
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };
  
  const renderStatCards = () => {
    if (isLoadingStats) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      );
    }
    
    if (!stats) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Ticket className="h-6 w-6" />}
          title="Tickets Abiertos"
          value={stats.open}
          changePercentage={8}
          changeText="desde ayer"
          iconColor="text-status-open"
          iconBgColor="bg-status-open/10"
        />
        
        <StatCard
          icon={<Clock className="h-6 w-6" />}
          title="En Proceso"
          value={stats.inProgress}
          changePercentage={-5}
          changeText="desde ayer"
          iconColor="text-status-progress"
          iconBgColor="bg-status-progress/10"
        />
        
        <StatCard
          icon={<PauseCircle className="h-6 w-6" />}
          title="En Espera"
          value={stats.onHold}
          changePercentage={0}
          changeText="sin cambios"
          iconColor="text-status-hold"
          iconBgColor="bg-status-hold/10"
        />
        
        <StatCard
          icon={<CheckCircle className="h-6 w-6" />}
          title="Cerrados"
          value={stats.closed}
          changePercentage={12}
          changeText="desde ayer"
          iconColor="text-status-closed"
          iconBgColor="bg-status-closed/10"
        />
      </div>
    );
  };
  
  // Renderizar estadísticas para usuarios normales
  const renderUserStats = () => {
    if (isLoadingUserTickets) {
      return (
        <div className="mb-8">
          <Skeleton className="h-32" />
        </div>
      );
    }
    
    // Contador de tickets por estado
    const ticketsByStatus: Record<string, number> = {
      open: 0,
      "in-progress": 0,
      "on-hold": 0,
      closed: 0
    };
    
    // Contador de tickets por prioridad
    const ticketsByPriority: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    
    userTickets.forEach(ticket => {
      ticketsByStatus[ticket.status] += 1;
      ticketsByPriority[ticket.priority] += 1;
    });
    
    return (
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-neutral-800 mb-4">Resumen de tus tickets</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="text-sm font-medium text-neutral-700 mb-2">Por Estado</h4>
              {Object.entries(ticketsByStatus)
                .filter(([status]) => status === "open" || status === "in-progress" || status === "on-hold" || status === "closed")
                .map(([status, count]) => {
                  const statusKey = status as keyof typeof TICKET_STATUS;
                  return (
                    <div key={status} className="flex items-center justify-between mb-1 text-sm">
                      <div className="flex items-center">
                        <span className={`w-3 h-3 rounded-full ${TICKET_STATUS[statusKey].bgColor.replace('/10', '')} mr-2`}></span>
                        <span>{TICKET_STATUS[statusKey].label}</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  );
                })}
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-neutral-700 mb-2">Por Prioridad</h4>
              {Object.entries(ticketsByPriority)
                .filter(([priority]) => priority === "low" || priority === "medium" || priority === "high" || priority === "critical")
                .map(([priority, count]) => {
                  const priorityKey = priority as keyof typeof TICKET_PRIORITY;
                  return (
                    <div key={priority} className="flex items-center justify-between mb-1 text-sm">
                      <div className="flex items-center">
                        <span className={`w-3 h-3 rounded-full ${TICKET_PRIORITY[priorityKey].bgColor.replace('/10', '')} mr-2`}></span>
                        <span>{TICKET_PRIORITY[priorityKey].label}</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  );
                })}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Total de tickets:</span>
            <span className="font-bold text-primary">{userTickets.length}</span>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} />
      
      <main className="flex-1 overflow-y-auto">
        <Header user={user} onLogout={onLogout} />
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-800">Dashboard</h2>
            
            <Button 
              onClick={openCreateModal}
              className="mt-4 md:mt-0 gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Ticket</span>
            </Button>
          </div>
          
          {/* Stats Cards - Para admin y agentes */}
          {(user.role === "admin" || user.role === "agent") && renderStatCards()}
          
          {/* User Stats - Solo para usuarios normales */}
          {user.role === "user" && renderUserStats()}
          
          {/* Tickets List */}
          <TicketList currentUser={user} />
          
          {/* Performance Metrics - Solo para admin y agentes */}
          {(user.role === "admin" || user.role === "agent") && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <PerformanceByPriority />
              <AgentPerformanceList />
            </div>
          )}
        </div>
      </main>
      
      {/* Create Ticket Modal */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        currentUser={user}
      />
    </div>
  );
}
