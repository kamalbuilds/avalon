"use client";

import { Card } from "./Card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("flex items-center gap-4", className)}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {trend && (
          <p
            className={cn(
              "text-xs font-medium",
              trend.isPositive ? "text-success" : "text-danger"
            )}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </p>
        )}
      </div>
    </Card>
  );
}
