import { cn } from "@/src/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      {Icon ? (
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl mb-4"
          style={{ background: "hsl(var(--muted))" }}
        >
          <Icon className="h-8 w-8 text-muted-foreground/40" />
        </div>
      ) : (
        <div className="mb-4">
          {/* Default box SVG illustration */}
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="64" height="64" rx="16" fill="hsl(var(--muted))" />
            <path
              d="M20 24L32 18L44 24V40L32 46L20 40V24Z"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="2"
              strokeLinejoin="round"
              fill="none"
              opacity="0.4"
            />
            <path
              d="M32 18V46M20 24L44 24"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth="2"
              opacity="0.3"
            />
          </svg>
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          {action.href ? (
            <Button size="sm" asChild>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
