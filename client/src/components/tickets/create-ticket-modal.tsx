import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, X, Upload } from "lucide-react";

const createTicketSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  priority: z.enum(["low", "medium", "high", "critical"]),
  assignedToId: z.string().optional()
});

type CreateTicketFormData = z.infer<typeof createTicketSchema>;

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

export function CreateTicketModal({ isOpen, onClose, currentUser }: CreateTicketModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      assignedToId: ""
    }
  });
  
  // Fetch users to assign ticket to (if current user is admin or agent)
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) return [];
      return response.json();
    },
    enabled: currentUser.role === "admin" || currentUser.role === "agent"
  });
  
  // Filter users to only show agents
  const agents = users.filter(user => user.role === "agent" || user.role === "admin");
  
  const createTicketMutation = useMutation({
    mutationFn: async (data: CreateTicketFormData) => {
      // Convert empty assignedToId to null
      const payload = {
        ...data,
        assignedToId: data.assignedToId ? parseInt(data.assignedToId) : undefined
      };
      
      return apiRequest("POST", "/api/tickets", payload);
    },
    onSuccess: () => {
      toast({
        title: "Ticket creado",
        description: "El ticket ha sido creado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el ticket. Inténtelo de nuevo.",
        variant: "destructive"
      });
      console.error("Error creating ticket:", error);
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });
  
  const onSubmit = (data: CreateTicketFormData) => {
    setIsSubmitting(true);
    createTicketMutation.mutate(data);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-neutral-800 flex items-center justify-between">
            Crear Nuevo Ticket
            <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto p-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Breve descripción del problema" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describa detalladamente el problema o la solicitud"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una prioridad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Baja</SelectItem>
                        <SelectItem value="medium">Media</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="critical">Crítica</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Assignee - only for admin/agent */}
              {(currentUser.role === "admin" || currentUser.role === "agent") && (
                <FormField
                  control={form.control}
                  name="assignedToId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asignar a</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sin asignar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Sin asignar</SelectItem>
                          {agents.map((agent) => (
                            <SelectItem key={agent.id} value={agent.id.toString()}>
                              {agent.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Attachments - UI only */}
              <div>
                <FormLabel>Archivos adjuntos</FormLabel>
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-4 mt-1">
                  <div className="text-center">
                    <Upload className="mx-auto h-6 w-6 text-neutral-400" />
                    <p className="mt-1 text-sm text-neutral-600">
                      Arrastre archivos aquí o <button type="button" className="text-primary hover:text-primary/80 font-medium">busque en su dispositivo</button>
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Formatos aceptados: JPG, PNG, PDF, DOC, DOCX (máx. 10 MB)
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </div>
        
        <DialogFooter className="border-t border-neutral-200 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Crear Ticket</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
