import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  setAuthenticated, 
  isAuthenticated as getIsAuthenticated, 
  storeUser, 
  getUser, 
  clearUser 
} from "@/lib/utils/auth";
import { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Get user from local storage initially
  const initialUser = getUser();
  
  // Query server for current user session
  const { 
    data, 
    isLoading, 
    isError, 
    refetch 
  } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: getQueryFn({ on401: "returnNull" }),
    initialData: initialUser ? { user: initialUser } : null,
    enabled: getIsAuthenticated()
  });

  // Auth state and logic
  const user = data?.user || null;

  // Handle login
  const login = async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      storeUser(data.user);
      setAuthenticated(true);
      
      // Refetch auth query and redirect
      await refetch();
      setLocation('/dashboard');
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.name}!`,
      });
      
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
      return false;
    }
  };

  // Handle logout
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      clearUser();
      setAuthenticated(false);
      queryClient.clear();
      setLocation('/login');
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      toast({
        title: "Logout error",
        description: "There was a problem logging out",
        variant: "destructive",
      });
    }
  };

  // Initialize auth state
  useEffect(() => {
    const checkAuth = async () => {
      // If we have a user but the session check failed, log out
      if (isError && initialUser) {
        clearUser();
        setAuthenticated(false);
        setLocation('/login');
      }
      
      // If we have a valid session but no localStorage user, update localStorage
      if (data?.user && !initialUser) {
        storeUser(data.user);
        setAuthenticated(true);
      }
      
      setIsInitialized(true);
    };

    if (!isLoading) {
      checkAuth();
    }
  }, [isLoading, isError, data, initialUser, setLocation]);

  // Redirect to login if not authenticated and not already on login page
  useEffect(() => {
    const handleUnauthenticated = () => {
      const [location] = useLocation();
      if (
        isInitialized && 
        !getIsAuthenticated() && 
        !user && 
        location !== '/login'
      ) {
        setLocation('/login');
      }
    };

    handleUnauthenticated();
  }, [isInitialized, user, setLocation]);

  return {
    user,
    isLoading: isLoading || !isInitialized,
    isAuthenticated: !!user,
    login,
    logout
  };
}

function getQueryFn<T>({ on401 }: { on401: "returnNull" | "throw" }) {
  return async ({ queryKey }: { queryKey: (string | number | object)[] }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: 'include',
    });

    if (on401 === "returnNull" && res.status === 401) {
      return null;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`${res.status}: ${text || res.statusText}`);
    }

    return await res.json();
  };
}
