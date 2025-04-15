import { useQuery } from "@tanstack/react-query";
import { PriorityPerformance } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { TICKET_PRIORITY } from "@/lib/constants";

export function PerformanceByPriority() {
  const { data: performance, isLoading } = useQuery<PriorityPerformance[]>({
    queryKey: ["/api/performance/priorities"],
    queryFn: async () => {
      const response = await fetch("/api/performance/priorities");
      if (!response.ok) throw new Error("Failed to fetch priority performance");
      return response.json();
    }
  });
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (!performance) return null;
  
  // Sort by priority importance
  const sortedPerformance = [...performance].sort((a, b) => {
    const priorities = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorities[a.priority] - priorities[b.priority];
  });
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-neutral-800 mb-4">Rendimiento por Prioridad</h3>
      <div className="space-y-4">
        {sortedPerformance.map((item) => {
          const priorityInfo = TICKET_PRIORITY[item.priority];
          return (
            <div key={item.priority}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full ${priorityInfo.bgColor.replace('/10', '')} mr-2`}></span>
                  <span className="text-sm font-medium">{priorityInfo.label}</span>
                </div>
                <span className="text-sm font-medium">{Math.round(item.slaComplianceRate)}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div 
                  className={`${priorityInfo.bgColor.replace('/10', '')} h-2 rounded-full`} 
                  style={{ width: `${Math.round(item.slaComplianceRate)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
