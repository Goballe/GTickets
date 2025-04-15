import { Comment, User } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils/sla";
import { MessageSquare } from "lucide-react";

interface TicketCommentProps {
  comment: Comment;
  user: User;
}

export default function TicketComment({ comment, user }: TicketCommentProps) {
  return (
    <div className="mb-4 relative">
      <div className="absolute -left-6 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
        <MessageSquare className="text-white h-2.5 w-2.5" />
      </div>
      <div className="bg-white p-3 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <span className="ml-2 text-sm font-medium">{user.name}</span>
          </div>
          <span className="text-xs text-neutral-500">{formatDate(comment.createdAt)}</span>
        </div>
        <p className="text-sm text-neutral-600 whitespace-pre-line">{comment.content}</p>
      </div>
    </div>
  );
}
