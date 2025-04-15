import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInMilliseconds, format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy HH:mm", { locale: es });
}

export function formatTimeAgo(date: Date | string) {
  if (!date) return "";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: es });
}

export function getSlaInfo(deadline: Date | string | null, status: string) {
  if (!deadline || status === "closed") {
    return {
      timeLeft: "Completado",
      percentage: 100,
      color: "text-status-closed",
      progressColor: "bg-status-closed"
    };
  }

  const deadlineDate = typeof deadline === "string" ? new Date(deadline) : deadline;
  const now = new Date();
  const diff = differenceInMilliseconds(deadlineDate, now);

  // If deadline has passed
  if (diff <= 0) {
    return {
      timeLeft: "Vencido",
      percentage: 0,
      color: "text-destructive",
      progressColor: "bg-destructive"
    };
  }

  // Calculate remaining percentage (assuming SLA starts from 72 hours before deadline for max value)
  // This is just a heuristic
  let totalTime = 72 * 60 * 60 * 1000; // 72 hours in ms
  
  // Calculate the remaining percentage, capped at 100%
  const percentage = Math.min(Math.floor((diff / totalTime) * 100), 100);
  
  // Format hours and minutes left
  const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
  const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  // Determine color based on percentage
  let color, progressColor;
  if (percentage > 75) {
    color = "text-green-500";
    progressColor = "bg-green-500";
  } else if (percentage > 40) {
    color = "text-orange-500";
    progressColor = "bg-orange-500";
  } else {
    color = "text-red-500";
    progressColor = "bg-red-500";
  }
  
  return {
    timeLeft: `${hoursLeft}h ${minutesLeft}m restantes`,
    percentage,
    color,
    progressColor
  };
}

export function getTicketNumberFromId(id: number) {
  return `TK-${id.toString().padStart(4, '0')}`;
}
