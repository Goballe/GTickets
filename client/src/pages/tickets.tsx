import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { TicketList } from "@/components/tickets/ticket-list";
import { CreateTicketModal } from "@/components/tickets/create-ticket-modal";
import { User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TicketsPageProps {
  user: User;
  onLogout: () => void;
}

export default function Tickets({ user, onLogout }: TicketsPageProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };
  
  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} />
      
      <main className="flex-1 overflow-y-auto">
        <Header user={user} onLogout={onLogout} />
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-800">Tickets</h2>
            
            <Button 
              onClick={openCreateModal}
              className="mt-4 md:mt-0 gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Ticket</span>
            </Button>
          </div>
          
          {/* Tickets List */}
          <TicketList currentUser={user} />
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
