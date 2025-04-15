import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Ticket, Comment, Activity, User } from "@/lib/types";
import { TICKET_STATUS, TICKET_PRIORITY, ACTIVITY_ICONS, ACTIVITY_COLORS } from "@/lib/constants";
import { formatTimeAgo, getSlaInfo } from "@/lib/utils";
import { X, AlertCircle, Download, Paperclip, AtSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface TicketDetailsModalProps {
  ticketId: number;
  currentUser: User;
  allUsers: User[];
  onClose: () => void;
}

export function TicketDetailsModal({ ticketId, currentUser, allUsers, onClose }: TicketDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);
  
  // Fetch ticket details
  const { 
    data: ticket,
    isLoading: isLoadingTicket 
  } = useQuery<Ticket>({
    queryKey: [`/api/tickets/${ticketId}`],
    queryFn: async () => {
      const response = await fetch(`/api/tickets/${ticketId}`);
      if (!response.ok) throw new Error("Failed to fetch ticket");
      return response.json();
    }
  });
  
  // Fetch comments
  const {
    data: comments = [],
    isLoading: isLoadingComments
  } = useQuery<Comment[]>({
    queryKey: [`/api/tickets/${ticketId}/comments`],
    queryFn: async () => {
      const response = await fetch(`/api/tickets/${ticketId}/comments`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
    enabled: !!ticket
  });
  
  // Fetch activities
  const {
    data: activities = [],
    isLoading: isLoadingActivities
  } = useQuery<Activity[]>({
    queryKey: [`/api/tickets/${ticketId}/activities`],
    queryFn: async () => {
      const response = await fetch(`/api/tickets/${ticketId}/activities`);
      if (!response.ok) throw new Error("Failed to fetch activities");
      return response.json();
    },
    enabled: !!ticket
  });
  
  // Mutation to add a comment
  const addCommentMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/tickets/${ticketId}/comments`, { content: comment });
    },
    onSuccess: () => {
      setComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/activities`] });
      toast({
        title: "Comentario añadido",
        description: "Tu comentario ha sido añadido correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo añadir el comentario",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsPostingComment(false);
    }
  });
  
  // Mutation to update ticket status
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest("PATCH", `/api/tickets/${ticketId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/activities`] });
      toast({
        title: "Estado actualizado",
        description: "El estado del ticket ha sido actualizado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del ticket",
        variant: "destructive"
      });
    }
  });
  
  // Mutation to update ticket assignee
  const updateAssigneeMutation = useMutation({
    mutationFn: async (assignedToId: number | null) => {
      return apiRequest("PATCH", `/api/tickets/${ticketId}/assign`, { assignedToId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}/activities`] });
      toast({
        title: "Asignación actualizada",
        description: "El ticket ha sido reasignado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo reasignar el ticket",
        variant: "destructive"
      });
    }
  });
  
  const handleSubmitComment = () => {
    if (!comment.trim()) return;
    setIsPostingComment(true);
    addCommentMutation.mutate();
  };
  
  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status);
  };
  
  const handleAssigneeChange = (assigneeId: string) => {
    const parsedId = assigneeId === "none" ? null : parseInt(assigneeId);
    updateAssigneeMutation.mutate(parsedId);
  };
  
  // Get user details
  const getUser = (userId: number): User | undefined => {
    return allUsers.find(user => user.id === userId);
  };
  
  const createdBy = ticket ? getUser(ticket.createdById) : undefined;
  const assignedTo = ticket?.assignedToId ? getUser(ticket.assignedToId) : undefined;
  
  // If still loading, show skeleton
  if (isLoadingTicket) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-neutral-800 flex items-center justify-between">
              <Skeleton className="h-6 w-64" />
              <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col md:flex-row h-[calc(90vh-132px)]">
            <div className="flex-1 p-6 overflow-y-auto">
              <Skeleton className="h-4 w-48 mb-4" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-24 w-full mb-4" />
            </div>
            <div className="w-full md:w-96 p-6 overflow-y-auto bg-neutral-50">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-24 w-full mb-4" />
              <Skeleton className="h-16 w-full mb-4" />
              <Skeleton className="h-16 w-full mb-4" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  if (!ticket) return null;
  
  const statusInfo = TICKET_STATUS[ticket.status];
  const priorityInfo = TICKET_PRIORITY[ticket.priority];
  const slaInfo = getSlaInfo(ticket.slaDeadline, ticket.status);
  
  // Filter agents for reassignment
  const agents = allUsers.filter(user => user.role === "agent" || user.role === "admin");
  
  // Determine if critical impact alert should be shown
  const showCriticalAlert = ticket.priority === "critical" && ticket.status !== "closed";
  
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-neutral-800 flex items-center justify-between">
            <div className="flex items-center">
              <span>{ticket.title}</span>
              <span className={`ml-3 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${priorityInfo.bgColor} ${priorityInfo.color}`}>
                {priorityInfo.label}
              </span>
            </div>
            <Button variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row h-[calc(90vh-132px)]">
          {/* Ticket Information */}
          <div className="flex-1 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-neutral-200">
            <div className="mb-6">
              <div className="flex items-center text-sm text-neutral-500 mb-4">
                <span>Ticket #{ticket.ticketNumber}</span>
                <span className="mx-2">•</span>
                <span>Creado {formatTimeAgo(ticket.createdAt)} por <span className="text-primary">{createdBy?.name || "Usuario desconocido"}</span></span>
              </div>
              
              <h4 className="text-sm font-medium text-neutral-700 mb-2">Descripción</h4>
              <p className="text-neutral-600">{ticket.description}</p>
              
              {showCriticalAlert && (
                <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r text-sm">
                  <div className="flex items-center">
                    <AlertCircle className="text-red-500 mr-2 h-4 w-4" />
                    <span className="font-medium text-red-700">Impacto crítico: Requiere atención inmediata.</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* SLA Information */}
            <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
              <h4 className="text-sm font-medium text-neutral-700 mb-2">Información de SLA</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-neutral-500">Tiempo de resolución</p>
                  <p className="text-sm font-medium">{TICKET_PRIORITY[ticket.priority].slaHours} horas</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Tiempo restante</p>
                  <p className={`text-sm font-medium ${slaInfo.color}`}>{slaInfo.timeLeft}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Última actualización</p>
                  <p className="text-sm font-medium">{formatTimeAgo(ticket.updatedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Asignado a</p>
                  <p className="text-sm font-medium">{assignedTo?.name || "Sin asignar"}</p>
                </div>
              </div>
              
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Progreso SLA</span>
                  <span className={`${slaInfo.color} font-medium`}>{slaInfo.percentage}%</span>
                </div>
                <div className="mt-1 w-full bg-neutral-200 rounded-full h-1.5">
                  <div className={`sla-indicator ${slaInfo.progressColor} h-1.5 rounded-full`} style={{width: `${slaInfo.percentage}%`}}></div>
                </div>
              </div>
            </div>
            
            {/* Actions and Attachments */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-neutral-700 mb-3">Acciones</h4>
              <div className="flex flex-wrap gap-2">
                {/* Status Change Dropdown */}
                {(currentUser.role === "admin" || currentUser.role === "agent" || ticket.createdById === currentUser.id) && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={ticket.status}
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Cambiar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Abierto</SelectItem>
                        <SelectItem value="in-progress">En proceso</SelectItem>
                        <SelectItem value="on-hold">En espera</SelectItem>
                        <SelectItem value="closed">Cerrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* Reassign Dropdown - only for admin/agent */}
                {(currentUser.role === "admin" || currentUser.role === "agent") && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={ticket.assignedToId?.toString() || ""}
                      onValueChange={handleAssigneeChange}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Reasignar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin asignar</SelectItem>
                        {agents.map(agent => (
                          <SelectItem key={agent.id} value={agent.id.toString()}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <h4 className="text-sm font-medium text-neutral-700 mt-4 mb-3">Archivos adjuntos</h4>
              <div className="text-sm text-neutral-500 italic">
                No hay archivos adjuntos.
              </div>
            </div>
          </div>
          
          {/* Activity and Comments */}
          <div className="w-full md:w-96 p-6 overflow-y-auto bg-neutral-50">
            <h4 className="text-sm font-medium text-neutral-700 mb-4 flex items-center justify-between">
              <span>Actividad y Comentarios</span>
              <span className="text-xs text-neutral-500">
                {(activities.length + comments.length)} eventos
              </span>
            </h4>
            
            <div className="space-y-4">
              {/* Comment Entry */}
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <Textarea
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  rows={2}
                  placeholder="Añadir un comentario..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <div className="mt-2 flex justify-between items-center">
                  <div>
                    <Button variant="ghost" size="icon">
                      <Paperclip className="h-4 w-4 text-neutral-400" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <AtSign className="h-4 w-4 text-neutral-400" />
                    </Button>
                  </div>
                  <Button 
                    size="sm"
                    onClick={handleSubmitComment}
                    disabled={!comment.trim() || isPostingComment}
                  >
                    Enviar
                  </Button>
                </div>
              </div>
              
              {/* Activity Timeline */}
              {(isLoadingComments || isLoadingActivities) ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <div className="relative pl-6 before:content-[''] before:absolute before:left-2 before:top-0 before:bottom-0 before:w-0.5 before:bg-neutral-200">
                  {/* Combine and sort activities and comments */}
                  {[...activities, ...comments.map(c => ({
                    id: `comment-${c.id}`,
                    action: "comment" as const,
                    details: c.content,
                    ticketId: c.ticketId,
                    userId: c.userId,
                    createdAt: c.createdAt,
                    isComment: true,
                    commentId: c.id
                  }))]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((item, index) => {
                      const user = getUser(item.userId) || { name: "Usuario desconocido" };
                      const isComment = 'isComment' in item;
                      
                      // Different rendering for comments vs activities
                      if (isComment) {
                        return (
                          <div key={`comment-${item.commentId}`} className="mb-4 relative">
                            <div className="absolute -left-6 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                              <span className="mdi mdi-comment-text-outline text-white text-xs"></span>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                    <span className="mdi mdi-account text-xs"></span>
                                  </div>
                                  <span className="ml-2 text-sm font-medium">{user.name}</span>
                                </div>
                                <span className="text-xs text-neutral-500">{formatTimeAgo(item.createdAt)}</span>
                              </div>
                              <p className="text-sm text-neutral-600">{item.details}</p>
                            </div>
                          </div>
                        );
                      } else {
                        // Activity
                        const activityType = item.action as keyof typeof ACTIVITY_ICONS;
                        const icon = ACTIVITY_ICONS[activityType] || "mdi-information-outline";
                        const bgColor = ACTIVITY_COLORS[activityType] || "bg-neutral-400";
                        
                        return (
                          <div key={`activity-${item.id}`} className="mb-4 relative">
                            <div className={`absolute -left-6 w-4 h-4 rounded-full ${bgColor} flex items-center justify-center`}>
                              <span className={`mdi ${icon} text-white text-xs`}></span>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="text-sm">
                                    {item.action === "created" && (
                                      <><span className="font-medium text-primary">{user.name}</span> creó este ticket</>
                                    )}
                                    {item.action === "status_change" && (
                                      <>{item.details}</>
                                    )}
                                    {item.action === "assignment" && (
                                      <>{item.details}</>
                                    )}
                                    {item.action === "updated" && (
                                      <><span className="font-medium text-primary">{user.name}</span> actualizó el ticket</>
                                    )}
                                  </span>
                                </div>
                                <span className="text-xs text-neutral-500">{formatTimeAgo(item.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
