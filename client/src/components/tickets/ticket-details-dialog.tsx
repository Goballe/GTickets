import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  SlaDefinition, 
  TicketWithDetails, 
  TicketStatus, 
  Comment,
  StatusUpdate,
  ActivityItem
} from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatTime } from "@/lib/utils/sla";
import { getStatusColorClass, getPriorityColorClass, calculateSla } from "@/lib/utils/sla";
import SlaProgress from "@/components/ui/sla-progress";
import TicketComment from "./ticket-comment";
import { 
  AlertCircle, 
  Pencil, 
  ArrowRightLeft, 
  Users, 
  Paperclip, 
  Download,
  AtSign,
  FileImage,
  FileText,
  MessageSquare,
  RefreshCw,
  User
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { isAgent } from "@/lib/utils/auth";
import { useUsers } from "@/hooks/use-users";

interface TicketDetailsDialogProps {
  ticketId: number;
  isOpen: boolean;
  onClose: () => void;
  slaDefinitions: SlaDefinition[];
}

export default function TicketDetailsDialog({ 
  ticketId, 
  isOpen, 
  onClose,
  slaDefinitions 
}: TicketDetailsDialogProps) {
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { agents } = useUsers();

  // Fetch ticket details
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/tickets', ticketId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/tickets/${ticketId}`, undefined);
      const data = await res.json();
      return data as TicketWithDetails;
    },
    enabled: isOpen
  });

  // Mutation for updating ticket status
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: TicketStatus) => {
      return apiRequest("PATCH", `/api/tickets/${ticketId}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Status updated",
        description: "Ticket status has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    }
  });

  // Mutation for updating ticket assignee
  const updateAssigneeMutation = useMutation({
    mutationFn: async (assignedToId: number | null) => {
      return apiRequest("PATCH", `/api/tickets/${ticketId}`, { 
        assignedToId: assignedToId === null ? null : assignedToId 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: "Assignee updated",
        description: "Ticket assignee has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update ticket assignee",
        variant: "destructive",
      });
    }
  });

  // Mutation for adding comment
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", `/api/tickets/${ticketId}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tickets', ticketId] });
      setCommentText("");
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  });

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate(newStatus as TicketStatus);
  };

  const handleAssigneeChange = (assigneeId: string) => {
    updateAssigneeMutation.mutate(assigneeId ? parseInt(assigneeId) : null);
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    setIsSubmittingComment(true);
    try {
      await addCommentMutation.mutateAsync(commentText);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Combine comments and status updates into a single activity feed
  const activityItems: ActivityItem[] = [];
  
  if (data) {
    // Add comments
    data.comments.forEach(comment => {
      activityItems.push({
        id: comment.id,
        type: 'comment',
        createdAt: comment.createdAt,
        user: comment.user!,
        data: comment
      });
    });
    
    // Add status updates
    data.statusUpdates.forEach(update => {
      activityItems.push({
        id: update.id,
        type: 'status_update',
        createdAt: update.createdAt,
        user: update.user!,
        data: update
      });
    });
  }
  
  // Sort by date (most recent first)
  activityItems.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      'open': 'Open',
      'in_progress': 'In Progress',
      'on_hold': 'On Hold',
      'closed': 'Closed'
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string): string => {
    const labels: Record<string, string> = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'critical': 'Critical'
    };
    return labels[priority] || priority;
  };

  const slaInfo = data?.ticket ? calculateSla(data.ticket, slaDefinitions) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 border-b border-neutral-200 flex flex-row items-center justify-between">
          {isLoading ? (
            <div className="flex-1">
              <Skeleton className="h-7 w-64 mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ) : isError ? (
            <div className="flex items-center text-red-500">
              <AlertCircle className="mr-2 h-5 w-5" />
              <span>Failed to load ticket details</span>
            </div>
          ) : (
            <div className="flex items-center">
              <div>
                <DialogTitle className="text-lg font-semibold text-neutral-800">
                  {data.ticket.title}
                </DialogTitle>
                <div className="flex items-center mt-2 gap-2">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      getStatusColorClass(data.ticket.status)
                    )}
                  >
                    {getStatusLabel(data.ticket.status)}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      getPriorityColorClass(data.ticket.priority)
                    )}
                  >
                    {getPriorityLabel(data.ticket.priority)}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogHeader>
        
        <div className="flex flex-col md:flex-row overflow-hidden h-[calc(90vh-180px)]">
          {/* Ticket Information */}
          <div className="flex-1 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-neutral-200">
            {isLoading ? (
              <div className="space-y-6">
                <div>
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-5/6 mb-1" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
                
                <div>
                  <Skeleton className="h-24 w-full rounded-lg" />
                </div>
                
                <div>
                  <Skeleton className="h-5 w-32 mb-2" />
                  <div className="flex gap-2 mb-4">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-28" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                  
                  <Skeleton className="h-5 w-32 mb-2" />
                  <div className="space-y-2">
                    <Skeleton className="h-16 w-full rounded-lg" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                </div>
              </div>
            ) : isError ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                  <h3 className="text-lg font-medium">Error loading ticket</h3>
                  <p className="text-neutral-500 mt-2">
                    Please try again later or contact support
                  </p>
                  <Button 
                    variant="outline"
                    className="mt-4"
                    onClick={onClose}
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="flex items-center text-sm text-neutral-500 mb-4">
                    <span>Ticket #{data.ticket.ticketNumber}</span>
                    <span className="mx-2">•</span>
                    <span>Created {formatDate(data.ticket.createdAt)} by{" "}
                      <span className="text-primary">{data.ticket.creator?.name}</span>
                    </span>
                  </div>
                  
                  <h4 className="text-sm font-medium text-neutral-700 mb-2">Description</h4>
                  <p className="text-neutral-600 whitespace-pre-line">{data.ticket.description}</p>
                  
                  {data.ticket.priority === 'critical' && (
                    <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-r text-sm">
                      <div className="flex items-center">
                        <AlertCircle className="text-red-500 mr-2 h-4 w-4" />
                        <span className="font-medium text-red-700">
                          Critical impact: This issue requires immediate attention
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* SLA Information */}
                <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
                  <h4 className="text-sm font-medium text-neutral-700 mb-2">SLA Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-neutral-500">Resolution time</p>
                      <p className="text-sm font-medium">
                        {slaInfo ? formatTime(slaInfo.totalMinutes) : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Time remaining</p>
                      <p className={cn(
                        "text-sm font-medium",
                        data.ticket.status === 'closed' 
                          ? "text-green-500" 
                          : slaInfo?.isExpired 
                            ? "text-red-500" 
                            : slaInfo?.percentageRemaining <= 25 
                              ? "text-red-500" 
                              : slaInfo?.percentageRemaining <= 50 
                                ? "text-orange-500" 
                                : "text-green-500"
                      )}>
                        {data.ticket.status === 'closed' 
                          ? 'Completed' 
                          : slaInfo?.displayString || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Last update</p>
                      <p className="text-sm font-medium">
                        {formatDate(data.ticket.updatedAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Assigned to</p>
                      <p className="text-sm font-medium">
                        {data.ticket.assignee ? data.ticket.assignee.name : 'Unassigned'}
                      </p>
                    </div>
                  </div>
                  
                  <SlaProgress 
                    ticket={data.ticket}
                    slaDefinitions={slaDefinitions}
                    className="mt-3"
                  />
                </div>
                
                {/* Actions and Attachments */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-neutral-700 mb-3">Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {isAgent(user) && (
                      <>
                        <Button 
                          variant="default" 
                          size="sm"
                          className="flex items-center text-sm"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          <span>Edit</span>
                        </Button>
                        
                        <Select
                          defaultValue={data.ticket.status}
                          onValueChange={handleStatusChange}
                          disabled={updateStatusMutation.isPending}
                        >
                          <SelectTrigger className="w-[170px] h-9 text-sm">
                            <div className="flex items-center">
                              <ArrowRightLeft className="h-4 w-4 mr-1" />
                              <span>Change status</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Select
                          defaultValue={data.ticket.assignedToId?.toString() || ""}
                          onValueChange={handleAssigneeChange}
                          disabled={updateAssigneeMutation.isPending}
                        >
                          <SelectTrigger className="w-[150px] h-9 text-sm">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              <span>Reassign</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Unassigned</SelectItem>
                            {agents?.map((agent) => (
                              <SelectItem 
                                key={agent.id} 
                                value={agent.id.toString()}
                              >
                                {agent.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </>
                    )}
                  </div>
                  
                  {data.attachments.length > 0 && (
                    <>
                      <h4 className="text-sm font-medium text-neutral-700 mt-4 mb-3">Attachments</h4>
                      <div className="space-y-2">
                        {data.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50">
                            {attachment.filename.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                              <FileImage className="h-5 w-5 text-neutral-400 mr-2" />
                            ) : (
                              <FileText className="h-5 w-5 text-neutral-400 mr-2" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-neutral-700">{attachment.filename}</p>
                              <p className="text-xs text-neutral-500">
                                {Math.round(attachment.size / 1024)} KB - Uploaded {formatDate(attachment.uploadedAt)}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="text-neutral-400 hover:text-neutral-600"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Activity and Comments */}
          <div className="w-full md:w-96 p-6 overflow-y-auto bg-neutral-50 flex flex-col h-full">
            <h4 className="text-sm font-medium text-neutral-700 mb-4 flex items-center justify-between">
              <span>Activity & Comments</span>
              {!isLoading && !isError && (
                <span className="text-xs text-neutral-500">
                  {activityItems.length} events
                </span>
              )}
            </h4>
            
            <div className="space-y-4 mb-4">
              {/* Comment Entry */}
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <Textarea
                  className="w-full px-3 py-2 text-sm resize-none"
                  rows={2}
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={isSubmittingComment}
                />
                <div className="mt-2 flex justify-between items-center">
                  <div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-neutral-400 hover:text-neutral-600"
                      disabled={isSubmittingComment}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-neutral-400 hover:text-neutral-600"
                      disabled={isSubmittingComment}
                    >
                      <AtSign className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!commentText.trim() || isSubmittingComment}
                  >
                    {isSubmittingComment ? "Sending..." : "Send"}
                  </Button>
                </div>
              </div>
              
              {/* Activity Timeline */}
              {isLoading ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-0 w-4 h-4 rounded-full bg-neutral-200"></div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                  <AlertCircle className="h-6 w-6 mx-auto text-red-500 mb-2" />
                  <p className="text-neutral-600">Failed to load activity</p>
                </div>
              ) : (
                <div className="relative pl-6 before:content-[''] before:absolute before:left-2 before:top-0 before:bottom-0 before:w-0.5 before:bg-neutral-200">
                  {activityItems.map((item) => {
                    if (item.type === 'comment') {
                      const comment = item.data as Comment;
                      return (
                        <TicketComment
                          key={`comment-${item.id}`}
                          comment={comment}
                          user={item.user}
                        />
                      );
                    } else {
                      const statusUpdate = item.data as StatusUpdate;
                      return (
                        <div key={`status-${item.id}`} className="mb-4 relative">
                          <div className={cn(
                            "absolute -left-6 w-4 h-4 rounded-full flex items-center justify-center",
                            getStatusColorClass(statusUpdate.newStatus).split(' ')[0]
                          )}>
                            <RefreshCw className="text-white h-2.5 w-2.5" />
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="text-sm">
                                  Status changed to{" "}
                                  <span className={cn(
                                    "font-medium",
                                    getStatusColorClass(statusUpdate.newStatus).split(' ')[1]
                                  )}>
                                    {getStatusLabel(statusUpdate.newStatus)}
                                  </span>
                                </span>
                              </div>
                              <span className="text-xs text-neutral-500">
                                {formatDate(statusUpdate.createdAt)}
                              </span>
                            </div>
                            <div className="mt-1 text-xs text-neutral-500">
                              By {statusUpdate.user?.name}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}

                  {/* Ticket Creation Entry */}
                  {data && (
                    <div className="relative">
                      <div className="absolute -left-6 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                        <Ticket className="text-white h-2.5 w-2.5" />
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-sm">
                              <span className="font-medium text-primary">
                                {data.ticket.creator?.name}
                              </span>{" "}
                              created this ticket
                            </span>
                          </div>
                          <span className="text-xs text-neutral-500">
                            {formatDate(data.ticket.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
