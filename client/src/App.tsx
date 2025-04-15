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

  // Efecto para cargar el usuario
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
  
  // Efecto para navegación
  useEffect(() => {
    if (isLoading) return;
    
    // Si el usuario no está autenticado y no está en la página de login, redirigir a login
    if (!user && location !== "/login") {
      setLocation("/login");
      return;
    }

    // Si el usuario está autenticado y está en la página de login, redirigir al dashboard
    if (user && location === "/login") {
      setLocation("/");
      return;
    }
  }, [user, location, setLocation, isLoading]);

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

  // Si el usuario no está autenticado, solo mostramos la ruta de inicio de sesión
  if (!user) {
    return (
      <Switch>
        <Route path="/login">
          <Login onLogin={setUser} />
        </Route>
        <Route>
          <Login onLogin={setUser} />
        </Route>
      </Switch>
    );
  }
  
  // Si el usuario está autenticado, mostramos todas las rutas
  return (
    <Switch>
      <Route path="/login">
        <Login onLogin={setUser} />
      </Route>
      <Route path="/">
        <Dashboard user={user} onLogout={handleLogout} />
      </Route>
      <Route path="/tickets">
        <Tickets user={user} onLogout={handleLogout} />
      </Route>
      <Route path="/users">
        {user.role === "admin" ? (
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
