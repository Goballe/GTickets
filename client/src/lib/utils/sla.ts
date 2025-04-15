import { SlaDefinition, Ticket, SlaInfo } from '../types';

/**
 * Calculate SLA information for a ticket based on its priority and creation time
 */
export function calculateSla(ticket: Ticket, slaDefinitions: SlaDefinition[]): SlaInfo {
  const slaDefinition = slaDefinitions.find(def => def.priority === ticket.priority);
  
  if (!slaDefinition) {
    return {
      totalMinutes: 0,
      remainingMinutes: 0,
      percentageRemaining: 100,
      isExpired: false,
      displayString: 'No SLA defined'
    };
  }
  
  const totalMinutes = slaDefinition.resolutionTimeMinutes;
  const createdAt = new Date(ticket.createdAt);
  const currentTime = new Date();
  
  // Calculate elapsed minutes
  const elapsedMinutes = Math.floor((currentTime.getTime() - createdAt.getTime()) / (1000 * 60));
  
  // Calculate remaining minutes
  const remainingMinutes = Math.max(0, totalMinutes - elapsedMinutes);
  
  // Calculate percentage remaining
  const percentageRemaining = Math.round((remainingMinutes / totalMinutes) * 100);
  
  // Check if SLA is expired
  const isExpired = remainingMinutes <= 0;
  
  // Create display string
  let displayString;
  
  if (ticket.status === 'closed') {
    displayString = 'Completed';
  } else if (isExpired) {
    displayString = 'Expired';
  } else {
    // Format remaining time
    if (remainingMinutes < 60) {
      displayString = `${remainingMinutes}m remaining`;
    } else {
      const hours = Math.floor(remainingMinutes / 60);
      const minutes = remainingMinutes % 60;
      
      if (hours < 24) {
        displayString = `${hours}h ${minutes}m remaining`;
      } else {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        displayString = `${days}d ${remainingHours}h remaining`;
      }
    }
  }
  
  return {
    totalMinutes,
    remainingMinutes,
    percentageRemaining,
    isExpired,
    displayString
  };
}

/**
 * Get color class based on SLA percentage
 */
export function getSlaColorClass(percentage: number): string {
  if (percentage <= 25) {
    return 'bg-red-500 text-red-500';
  } else if (percentage <= 50) {
    return 'bg-orange-500 text-orange-500';
  } else {
    return 'bg-green-500 text-green-500';
  }
}

/**
 * Get status color class
 */
export function getStatusColorClass(status: string): string {
  switch (status) {
    case 'open':
      return 'bg-blue-100 text-blue-700';
    case 'in_progress':
      return 'bg-orange-100 text-orange-700';
    case 'on_hold':
      return 'bg-purple-100 text-purple-700';
    case 'closed':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

/**
 * Get priority color class
 */
export function getPriorityColorClass(priority: string): string {
  switch (priority) {
    case 'low':
      return 'bg-green-100 text-green-700 border-l-green-500';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 border-l-yellow-500';
    case 'high':
      return 'bg-orange-100 text-orange-700 border-l-orange-500';
    case 'critical':
      return 'bg-red-100 text-red-700 border-l-red-500';
    default:
      return 'bg-gray-100 text-gray-700 border-l-gray-500';
  }
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays} days ago`;
  
  return date.toLocaleDateString();
}

/**
 * Format time for display
 */
export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours < 24) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
  }
}
