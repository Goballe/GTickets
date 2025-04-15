import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { User } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Search, Loader2, UserPlus } from "lucide-react";

const userFormSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Correo electrónico inválido"),
  role: z.enum(["user", "agent", "admin"], {
    required_error: "Debe seleccionar un rol",
  }),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UsersPageProps {
  user: User;
  onLogout: () => void;
}

export default function Users({ user, onLogout }: UsersPageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      email: "",
      role: "user",
    },
  });
  
  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });
  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      return apiRequest("POST", "/api/users", data);
    },
    onSuccess: () => {
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateModalOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el usuario",
        variant: "destructive",
      });
      console.error("Error creating user:", error);
    },
  });
  
  const onSubmit = (data: UserFormData) => {
    createUserMutation.mutate(data);
  };
  
  // Filter users based on search query
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Get role label
  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "agent":
        return "Agente de Soporte";
      case "user":
        return "Usuario";
      default:
        return "Desconocido";
    }
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} onLogout={onLogout} />
      
      <main className="flex-1 overflow-y-auto">
        <Header user={user} onLogout={onLogout} />
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-800">Usuarios</h2>
            
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 md:mt-0 gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span>Nuevo Usuario</span>
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Usuarios</CardTitle>
              <CardDescription>
                Administre los usuarios del sistema de soporte.
              </CardDescription>
              
              <div className="mt-4 relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuarios..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Correo</TableHead>
                        <TableHead>Rol</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No se encontraron usuarios.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.id}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  user.role === "admin"
                                    ? "bg-primary/10 text-primary"
                                    : user.role === "agent"
                                    ? "bg-status-hold/10 text-status-hold"
                                    : "bg-neutral-200 text-neutral-700"
                                }`}
                              >
                                {getRoleLabel(user.role)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Create User Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Añada un nuevo usuario al sistema de soporte.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de Usuario</FormLabel>
                    <FormControl>
                      <Input placeholder="usuario1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="usuario@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">Usuario</SelectItem>
                        <SelectItem value="agent">Agente de Soporte</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              onClick={form.handleSubmit(onSubmit)}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Crear Usuario
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
