import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ticket, User } from "@/lib/types";
import { TicketCard } from "./ticket-card";
import { TicketFilters } from "./ticket-filters";
import { TicketDetailsModal } from "./ticket-details-modal";
import { Skeleton } from "@/components/ui/skeleton";

interface TicketListProps {
  currentUser: User;
}

export function TicketList({ currentUser }: TicketListProps) {
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    priority: ""
  });
  const [page, setPage] = useState(1);
  const perPage = 4;
  
  // Fetch tickets with optional filters
  const {
    data: tickets = [],
    isLoading,
    refetch
  } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets", filters.status, filters.priority],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      
      if (filters.status) {
        queryParams.append("status", filters.status);
      }
      
      if (filters.priority) {
        queryParams.append("priority", filters.priority);
      }
      
      const response = await fetch(`/api/tickets?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch tickets");
      return response.json();
    }
  });
  
  // Fetch users to display names
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) return [];
      return response.json();
    },
    // Only fetch users if current user is admin or agent
    enabled: currentUser.role === "admin" || currentUser.role === "agent"
  });
  
  const getUserById = (userId: number): User => {
    // Si es el usuario actual, devolver directamente
    if (userId === currentUser.id) {
      return currentUser;
    }
    
    // Para usuarios normales que no tienen acceso a la lista de usuarios
    if (currentUser.role === "user") {
      return {
        id: userId,
        name: userId === currentUser.id ? currentUser.name : "Usuario del Sistema",
        username: userId === currentUser.id ? currentUser.username : "system",
        email: userId === currentUser.id ? currentUser.email : "system@supportdesk.com",
        role: "user"
      };
    }
    
    // Para admin/agentes que tienen la lista completa de usuarios
    return users.find(user => user.id === userId) || {
      id: userId,
      name: "Usuario Desconocido",
      username: "unknown",
      email: "unknown@example.com",
      role: "user"
    };
  };
  
  // Pagination logic
  const totalPages = Math.ceil(tickets.length / perPage);
  const paginatedTickets = tickets.slice((page - 1) * perPage, page * perPage);
  
  // Handle view ticket details
  const handleViewDetails = (ticketId: number) => {
    setSelectedTicketId(ticketId);
  };
  
  // Handle close ticket details modal
  const handleCloseDetails = () => {
    setSelectedTicketId(null);
    refetch();
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-neutral-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <h3 className="text-lg font-semibold text-neutral-800">Tickets Recientes</h3>
          
          <TicketFilters
            filters={filters}
            onFilterChange={(newFilters) => {
              setFilters(newFilters);
              setPage(1);
            }}
          />
        </div>
      </div>
      
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="border rounded-lg p-4">
                <div className="flex justify-between">
                  <div>
                    <Skeleton className="h-6 w-64 mb-2" />
                    <Skeleton className="h-4 w-48 mb-4" />
                  </div>
                  <div className="flex flex-col items-end">
                    <Skeleton className="h-6 w-20 mb-2" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {tickets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-500">No se encontraron tickets con los filtros seleccionados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedTickets.map((ticket) => (
                  <TicketCard 
                    key={ticket.id}
                    ticket={ticket}
                    createdBy={getUserById(ticket.createdById)}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {tickets.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-neutral-500">
                  Mostrando <span className="font-medium">{(page - 1) * perPage + 1}</span> a <span className="font-medium">{Math.min(page * perPage, tickets.length)}</span> de <span className="font-medium">{tickets.length}</span> tickets
                </div>
                
                <div className="flex space-x-1">
                  <button 
                    className="px-3 py-1 rounded border border-neutral-200 text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <span className="mdi mdi-chevron-left"></span>
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const pageNum = i + 1;
                    const isActive = pageNum === page;
                    
                    return (
                      <button 
                        key={i}
                        className={`px-3 py-1 rounded border border-neutral-200 ${isActive ? 'bg-primary text-white' : 'text-neutral-700 hover:bg-neutral-100'}`}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button 
                    className="px-3 py-1 rounded border border-neutral-200 text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <span className="mdi mdi-chevron-right"></span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Ticket Details Modal */}
      {selectedTicketId && (
        <TicketDetailsModal
          ticketId={selectedTicketId}
          currentUser={currentUser}
          allUsers={users}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
}
