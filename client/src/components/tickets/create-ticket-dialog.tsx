import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, X } from "lucide-react";
import { useUsers } from "@/hooks/use-users";

interface CreateTicketDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: z.enum(["low", "medium", "high", "critical"]),
  assignedToId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateTicketDialog({ isOpen, onClose }: CreateTicketDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { agents, isLoading: isLoadingAgents } = useUsers();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      assignedToId: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        assignedToId: data.assignedToId ? parseInt(data.assignedToId) : undefined,
        status: "open",
      };

      await apiRequest("POST", "/api/tickets", payload);
      
      toast({
        title: "Ticket created",
        description: "Your ticket has been created successfully",
      });
      
      // Invalidate tickets queries
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      form.reset();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-neutral-800">Create New Ticket</DialogTitle>
          <DialogDescription>
            Fill out the form below to create a new support ticket.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief description of the issue"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of the problem or request"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="assignedToId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign to</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {!isLoadingAgents && agents?.map((agent) => (
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
            
            <div>
              <FormLabel>Attachments</FormLabel>
              <div className="border-2 border-dashed border-neutral-300 rounded-lg p-4 mt-1">
                <div className="text-center">
                  <Upload className="h-6 w-6 mx-auto text-neutral-400" />
                  <p className="mt-1 text-sm text-neutral-600">
                    Drag files here or{" "}
                    <Button 
                      type="button" 
                      variant="link" 
                      className="text-primary hover:text-primary/80 p-0 h-auto font-medium"
                    >
                      browse from your device
                    </Button>
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Accepted formats: JPG, PNG, PDF, DOC, DOCX (max. 10 MB)
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>Creating...</>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Ticket
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
