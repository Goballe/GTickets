import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: ReactNode;
  title: string;
  value: number;
  changePercentage?: number;
  changeText?: string;
  iconColor: string;
  iconBgColor: string;
}

export function StatCard({ 
  icon, 
  title, 
  value, 
  changePercentage, 
  changeText,
  iconColor,
  iconBgColor
}: StatCardProps) {
  // Determine if change is positive, negative or neutral
  const isPositive = changePercentage && changePercentage > 0;
  const isNegative = changePercentage && changePercentage < 0;
  const changeIconClass = isPositive ? "mdi-arrow-up" : isNegative ? "mdi-arrow-down" : "mdi-minus";
  const changeColorClass = isPositive ? "text-status-open" : isNegative ? "text-red-500" : "text-neutral-500";
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center">
        <div className={cn("rounded-full p-3", iconBgColor, iconColor)}>
          {icon}
        </div>
        <div className="ml-4">
          <h3 className="text-neutral-500 text-sm font-medium">{title}</h3>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
      </div>
      
      {(changePercentage !== undefined && changeText) && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`mdi ${changeIconClass} ${changeColorClass}`}></span>
          <span className={`${changeColorClass} font-medium ml-1`}>
            {isPositive ? "+" : ""}{changePercentage}%
          </span>
          <span className="text-neutral-500 ml-2">{changeText}</span>
        </div>
      )}
    </div>
  );
}
