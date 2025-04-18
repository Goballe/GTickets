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

  // Si el usuario no está autenticado, y no estamos en la página de login, 
  // mostrar la pantalla de login directamente sin usar Switch
  if (!user && !isLoading) {
    return <Login onLogin={setUser} />;
  }
  
  // Dado que ya hemos verificado que user no es null a este punto,
  // podemos usar una aserción de tipo para ayudar a TypeScript
  const authenticatedUser = user as User; // Esto es seguro porque ya verificamos que user no es null

  // Si el usuario está autenticado, mostramos todas las rutas
  return (
    <Switch>
      <Route path="/login">
        <Login onLogin={setUser} />
      </Route>
      <Route path="/">
        <Dashboard user={authenticatedUser} onLogout={handleLogout} />
      </Route>
      <Route path="/tickets">
        <Tickets user={authenticatedUser} onLogout={handleLogout} />
      </Route>
      <Route path="/users">
        {authenticatedUser.role === "admin" ? (
          <Users user={authenticatedUser} onLogout={handleLogout} />
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
