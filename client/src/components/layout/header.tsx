import { useState } from "react";
import { User } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Bell, Search } from "lucide-react";
import { Sidebar } from "./sidebar";

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onSearch?: (query: string) => void;
}

export function Header({ user, onLogout, onSearch }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button type="button" className="text-neutral-400 hover:text-neutral-600 focus:outline-none">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 bg-primary text-white">
              <Sidebar user={user} onLogout={onLogout} />
            </SheetContent>
          </Sheet>
          <h1 className="ml-3 text-lg font-medium">SupportDesk</h1>
        </div>
        
        {/* Search Bar */}
        <div className="hidden md:block max-w-md w-full">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-300">
                <Search className="h-5 w-5" />
              </span>
              <Input 
                type="text" 
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary/50" 
                placeholder="Buscar tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
        </div>
        
        {/* User Actions */}
        <div className="flex items-center">
          <button type="button" className="p-2 rounded-full text-neutral-400 hover:bg-neutral-100 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="ml-4 relative flex items-center">
            <div className="flex items-center focus:outline-none">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="mdi mdi-account text-xl"></span>
              </div>
              <span className="hidden md:flex ml-2 text-sm font-medium text-neutral-700">{user.name}</span>
              <span className="mdi mdi-chevron-down text-neutral-400 ml-1"></span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
