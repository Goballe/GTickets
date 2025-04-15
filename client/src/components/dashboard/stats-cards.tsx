import { useMemo } from "react";
import { DashboardStats } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket, Clock, PauseCircle, CheckCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardsProps {
  stats: DashboardStats;
  isLoading: boolean;
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  // Mock data for trend changes
  const trends = useMemo(() => ({
    open: { change: 8, isUp: true },
    in_progress: { change: 5, isUp: false },
    on_hold: { change: 0, isUp: false },
    closed: { change: 12, isUp: true },
  }), []);

  const cards = [
    {
      title: "Tickets Open",
      value: stats?.statusCounts?.open || 0,
      icon: <Ticket className="text-2xl" />,
      color: "bg-blue-500/10 text-blue-500",
      trend: trends.open
    },
    {
      title: "In Progress",
      value: stats?.statusCounts?.in_progress || 0,
      icon: <Clock className="text-2xl" />,
      color: "bg-orange-500/10 text-orange-500",
      trend: trends.in_progress
    },
    {
      title: "On Hold",
      value: stats?.statusCounts?.on_hold || 0,
      icon: <PauseCircle className="text-2xl" />,
      color: "bg-purple-500/10 text-purple-500",
      trend: trends.on_hold
    },
    {
      title: "Closed",
      value: stats?.statusCounts?.closed || 0,
      icon: <CheckCircle className="text-2xl" />,
      color: "bg-green-500/10 text-green-500",
      trend: trends.closed
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <Card key={index} className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className={`rounded-full p-3 ${card.color}`}>
                {card.icon}
              </div>
              <div className="ml-4">
                <h3 className="text-neutral-500 text-sm font-medium">{card.title}</h3>
                <p className="text-2xl font-semibold mt-1">
                  {isLoading ? "-" : card.value}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              {card.trend.change > 0 ? (
                card.trend.isUp ? (
                  <>
                    <TrendingUp className={`h-4 w-4 ${card.color.split(' ')[1]}`} />
                    <span className={`${card.color.split(' ')[1]} font-medium ml-1`}>+{card.trend.change}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-red-500 font-medium ml-1">-{card.trend.change}%</span>
                  </>
                )
              ) : (
                <>
                  <Minus className="h-4 w-4 text-neutral-500" />
                  <span className="text-neutral-500 font-medium ml-1">0%</span>
                </>
              )}
              <span className="text-neutral-500 ml-2">since yesterday</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
