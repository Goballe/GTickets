import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Tickets from "@/pages/tickets";
import Login from "@/pages/login";
import Users from "@/pages/users";
import { useState, useEffect } from "react";
import { apiRequest } from "./lib/queryClient";
import { User } from "./lib/types";
import { Loader2 } from "lucide-react";

function Router() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include"
        });
        
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      setUser(null);
      setLocation("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is not logged in and not on login page, redirect to login
  if (!user && location !== "/login") {
    setLocation("/login");
    return null;
  }

  // If user is logged in and on login page, redirect to dashboard
  if (user && location === "/login") {
    setLocation("/");
    return null;
  }

  return (
    <Switch>
      <Route path="/login">
        <Login onLogin={setUser} />
      </Route>
      <Route path="/">
        <Dashboard user={user!} onLogout={handleLogout} />
      </Route>
      <Route path="/tickets">
        <Tickets user={user!} onLogout={handleLogout} />
      </Route>
      <Route path="/users">
        {user?.role === "admin" ? (
          <Users user={user} onLogout={handleLogout} />
        ) : (
          <NotFound />
        )}
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
