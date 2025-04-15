import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { TicketList } from "@/components/tickets/ticket-list";
import { CreateTicketModal } from "@/components/tickets/create-ticket-modal";
import { PerformanceByPriority } from "@/components/dashboard/performance-by-priority";
import { AgentPerformanceList } from "@/components/dashboard/agent-performance";
import { User, TicketStats } from "@/lib/types";
import { Ticket, Clock, PauseCircle, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // Fetch ticket stats
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
          
          {/* Stats Cards - Only for admin and agents */}
          {(user.role === "admin" || user.role === "agent") && renderStatCards()}
          
          {/* Tickets List */}
          <TicketList currentUser={user} />
          
          {/* Performance Metrics - Only for admin and agents */}
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
