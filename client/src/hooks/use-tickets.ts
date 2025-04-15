import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ticket, SlaDefinition } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Hook to fetch all tickets
export function useTickets(statusFilter?: string, priorityFilter?: string) {
  let queryUrl = '/api/tickets';
  const queryParams = [];
  
  if (statusFilter && statusFilter !== 'all') {
    queryParams.push(`status=${statusFilter}`);
  }
  
  if (priorityFilter && priorityFilter !== 'all') {
    queryParams.push(`priority=${priorityFilter}`);
  }
  
  if (queryParams.length > 0) {
    queryUrl += `?${queryParams.join('&')}`;
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/tickets', statusFilter, priorityFilter],
    queryFn: async () => {
      const res = await apiRequest("GET", queryUrl, undefined);
      const data = await res.json();
      return data.tickets as Ticket[];
    }
  });

  return {
    tickets: data || [],
    isLoading,
    isError,
    error
  };
}

// Hook to fetch a single ticket
export function useTicket(ticketId: number | null) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/tickets', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const res = await apiRequest("GET", `/api/tickets/${ticketId}`, undefined);
      return res.json();
    },
    enabled: !!ticketId
  });

  return {
    ticket: data,
    isLoading,
    isError,
    error
  };
}

// Hook to fetch SLA definitions
export function useSlaDefinitions() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['/api/sla-definitions'],
    queryFn: async () => {
      const res = await apiRequest("GET", '/api/sla-definitions', undefined);
      const data = await res.json();
      return data.slaDefinitions as SlaDefinition[];
    }
  });

  return {
    slaDefinitions: data || [],
    isLoading,
    isError,
    error
  };
}

// Hook to create a ticket
export function useCreateTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const mutation = useMutation({
    mutationFn: async (ticketData: any) => {
      const res = await apiRequest("POST", "/api/tickets", ticketData);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      toast({
        title: "Success",
        description: "Ticket created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket",
        variant: "destructive",
      });
    }
  });
  
  return mutation;
}

// Hook to update a ticket
export function useUpdateTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const mutation = useMutation({
    mutationFn: async ({ ticketId, data }: { ticketId: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/tickets/${ticketId}`, data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      toast({
        title: "Success",
        description: "Ticket updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update ticket",
        variant: "destructive",
      });
    }
  });
  
  return mutation;
}

// Hook to add a comment to a ticket
export function useAddComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const mutation = useMutation({
    mutationFn: async ({ ticketId, content }: { ticketId: number; content: string }) => {
      const res = await apiRequest("POST", `/api/tickets/${ticketId}/comments`, { content });
      return res.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', variables.ticketId] });
      
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    }
  });
  
  return mutation;
}
