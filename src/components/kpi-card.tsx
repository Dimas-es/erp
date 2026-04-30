"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import CountUp from "react-countup";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils";

interface KpiCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  icon: ReactNode;
  trend?: number;
  trendLabel?: string;
  iconBg?: string;
  isCurrency?: boolean;
}

function formatShortNumber(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}jt`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}rb`;
  return value.toString();
}

export function KpiCard({
  title,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  icon,
  trend,
  trendLabel,
  iconBg = "bg-primary/10",
  isCurrency = false,
}: KpiCardProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;

  return (
    <Card className="relative overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Subtle top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: "linear-gradient(90deg, hsl(var(--accent)), transparent)" }}
      />
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="mt-1.5 flex items-baseline gap-1">
              {isCurrency && (
                <span className="text-lg font-semibold text-muted-foreground">Rp</span>
              )}
              <span className="text-2xl font-bold tabular-nums leading-none">
                {mounted ? (
                  isCurrency ? (
                    <CountUp
                      end={value}
                      duration={1.2}
                      separator="."
                      decimals={0}
                      formattingFn={(v) => formatShortNumber(v)}
                    />
                  ) : (
                    <CountUp
                      end={value}
                      duration={1.2}
                      separator="."
                      decimals={decimals}
                      prefix={prefix}
                      suffix={suffix}
                    />
                  )
                ) : (
                  <span>{isCurrency ? formatShortNumber(value) : `${prefix}${value}${suffix}`}</span>
                )}
              </span>
            </div>
            {trend !== undefined && (
              <div className="mt-2 flex items-center gap-1">
                {trendPositive ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : trendNegative ? (
                  <TrendingDown className="h-3 w-3 text-destructive" />
                ) : (
                  <Minus className="h-3 w-3 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium",
                    trendPositive && "text-success",
                    trendNegative && "text-destructive",
                    !trendPositive && !trendNegative && "text-muted-foreground"
                  )}
                >
                  {trendPositive ? "+" : ""}
                  {trend}% {trendLabel ?? "vs kemarin"}
                </span>
              </div>
            )}
          </div>
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl shrink-0", iconBg)}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
