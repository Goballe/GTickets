import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Sidebar from "./sidebar";
import Header from "./header";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, isLoading } = useAuth();

  // Close sidebar on route change (for mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // If user is not authenticated and not on login page, show loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Show only the children content for the login page
  if (location === "/login") {
    return <div className="min-h-screen bg-neutral-100">{children}</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-100">
      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div 
            className="w-64 h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar user={user} />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <Sidebar user={user} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <Header user={user} onToggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />
        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
