import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface CompactCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  className?: string;
  children?: React.ReactNode;
}

export const CompactCard: React.FC<CompactCardProps> = ({
  title,
  value,
  description,
  icon,
  badge,
  className,
  children
}) => {
  return (
    <Card className={cn("w-64 h-48 bg-black/90 border-white/20 text-white", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-white/90">{title}</CardTitle>
          {icon}
        </div>
        {badge && (
          <Badge variant="outline" className="text-xs text-white/70 border-white/30">
            {badge}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        {description && (
          <CardDescription className="text-xs text-white/60">
            {description}
          </CardDescription>
        )}
        {children}
      </CardContent>
    </Card>
  );
};
