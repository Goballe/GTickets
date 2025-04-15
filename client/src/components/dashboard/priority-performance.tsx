import { PriorityPerformance } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PriorityPerformanceChartProps {
  data: PriorityPerformance[];
  isLoading: boolean;
}

export default function PriorityPerformanceChart({ data, isLoading }: PriorityPerformanceChartProps) {
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-neutral-500';
    }
  };

  const getPriorityDisplayName = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'Critical';
      case 'high': return 'High';
      case 'medium': return 'Medium';
      case 'low': return 'Low';
      default: return priority;
    }
  };

  return (
    <Card className="shadow-sm h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-neutral-800">Performance by Priority</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            Array(4).fill(0).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-neutral-200 mr-2"></div>
                    <div className="h-4 w-20 bg-neutral-200 rounded"></div>
                  </div>
                  <div className="h-4 w-8 bg-neutral-200 rounded"></div>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2"></div>
              </div>
            ))
          ) : (
            data.map((item) => (
              <div key={item.priority}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center">
                    <span className={`w-3 h-3 rounded-full ${getPriorityColor(item.priority)} mr-2`}></span>
                    <span className="text-sm font-medium">{getPriorityDisplayName(item.priority)}</span>
                  </div>
                  <span className="text-sm font-medium">{item.slaCompliance}%</span>
                </div>
                <Progress value={item.slaCompliance} className="h-2" indicatorClassName={getPriorityColor(item.priority)} />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
