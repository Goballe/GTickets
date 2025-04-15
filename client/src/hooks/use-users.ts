import { useQuery } from "@tanstack/react-query";
import { User } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";

// Hook to fetch all users
export function useUsers() {
  const { data: agentsData, isLoading: isLoadingAgents, isError: isErrorAgents } = useQuery({
    queryKey: ['/api/users/agents'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users/agents", undefined);
      const data = await res.json();
      return data.agents as User[];
    }
  });

  const { data: usersData, isLoading: isLoadingUsers, isError: isErrorUsers } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users", undefined);
      const data = await res.json();
      return data.users as User[];
    }
  });

  return {
    agents: agentsData || [],
    users: usersData || [],
    isLoadingAgents,
    isErrorAgents,
    isLoadingUsers,
    isErrorUsers,
    isLoading: isLoadingAgents || isLoadingUsers,
    isError: isErrorAgents || isErrorUsers
  };
}
