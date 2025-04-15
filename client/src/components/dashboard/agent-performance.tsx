import { useQuery } from "@tanstack/react-query";
import { AgentPerformance } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export function AgentPerformanceList() {
  const { data: agentPerformance, isLoading } = useQuery<AgentPerformance[]>({
    queryKey: ["/api/performance/agents"],
    queryFn: async () => {
      const response = await fetch("/api/performance/agents");
      if (!response.ok) throw new Error("Failed to fetch agent performance");
      return response.json();
    }
  });
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center p-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="ml-3 flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-48" />
              </div>
              <div className="text-right">
                <Skeleton className="h-4 w-10 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (!agentPerformance || agentPerformance.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Rendimiento por Agente</h3>
        <p className="text-neutral-500 text-center py-4">No hay datos de rendimiento disponibles.</p>
      </div>
    );
  }
  
  // Sort by SLA compliance
  const sortedAgents = [...agentPerformance].sort((a, b) => b.slaComplianceRate - a.slaComplianceRate);
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-neutral-800 mb-4">Rendimiento por Agente</h3>
      <div className="space-y-4">
        {sortedAgents.map((agent) => {
          const slaColor = agent.slaComplianceRate >= 90 
            ? "text-status-closed"
            : agent.slaComplianceRate >= 75
              ? "text-orange-500"
              : "text-red-500";
              
          return (
            <div key={agent.userId} className="flex items-center p-2 hover:bg-neutral-50 rounded">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="mdi mdi-account text-xl"></span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{agent.name}</p>
                <div className="flex items-center text-xs text-neutral-500 mt-1">
                  <span>{agent.ticketsResolved} tickets resueltos</span>
                  <span className="mx-2">•</span>
                  <span>Tiempo promedio: {agent.averageResolutionTime.toFixed(1)}h</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-sm font-medium ${slaColor}`}>
                  {Math.round(agent.slaComplianceRate)}%
                </span>
                <p className="text-xs text-neutral-500">dentro de SLA</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
