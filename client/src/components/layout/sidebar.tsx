import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { User } from "@/lib/types";

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const [location] = useLocation();
  
  return (
    <aside className="hidden md:flex flex-col w-64 bg-primary text-white">
      <div className="p-4 border-b border-indigo-800">
        <h1 className="text-xl font-semibold">SupportDesk</h1>
      </div>
      
      {/* User Info */}
      <div className="p-4 border-b border-indigo-800 flex items-center">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
          <span className="mdi mdi-account text-xl"></span>
        </div>
        <div className="ml-3">
          <p className="font-medium">{user.name}</p>
          <p className="text-xs text-white/70">
            {user.role === "admin" ? "Administrador" : 
             user.role === "agent" ? "Agente de Soporte" : 
             "Usuario"}
          </p>
        </div>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 px-2 py-4">
        <ul>
          <li className="mb-2">
            <Link href="/">
              <a className={cn(
                "flex items-center px-4 py-2 rounded-lg text-white hover:bg-white/20",
                location === "/" && "bg-white/10"
              )}>
                <span className="mdi mdi-view-dashboard mr-3 text-xl"></span>
                <span>Dashboard</span>
              </a>
            </Link>
          </li>
          <li className="mb-2">
            <Link href="/tickets">
              <a className={cn(
                "flex items-center px-4 py-2 rounded-lg text-white/80 hover:bg-white/20",
                location === "/tickets" && "bg-white/10 text-white"
              )}>
                <span className="mdi mdi-ticket mr-3 text-xl"></span>
                <span>Tickets</span>
              </a>
            </Link>
          </li>
          {user.role === "admin" && (
            <li className="mb-2">
              <Link href="/users">
                <a className={cn(
                  "flex items-center px-4 py-2 rounded-lg text-white/80 hover:bg-white/20",
                  location === "/users" && "bg-white/10 text-white"
                )}>
                  <span className="mdi mdi-account-group mr-3 text-xl"></span>
                  <span>Usuarios</span>
                </a>
              </Link>
            </li>
          )}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-indigo-800">
        <button 
          onClick={onLogout}
          className="flex items-center text-white/80 hover:text-white"
        >
          <span className="mdi mdi-logout mr-2"></span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
