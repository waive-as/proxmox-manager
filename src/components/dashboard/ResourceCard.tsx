
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResourceCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  description?: string;
  showProgress?: boolean;
}

const ResourceCard: React.FC<ResourceCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor,
  description,
  showProgress = true,
}) => {
  return (
    <Card className="glass-panel hover-scale">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <Icon className={`h-8 w-8 ${iconColor}`} />
          <span className="text-3xl font-bold">
            {value}
            {showProgress ? "%" : ""}
          </span>
        </div>
        {showProgress && (
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500 ease-in-out rounded-full",
                value < 50 ? iconColor : value < 80 ? "bg-amber-500" : "bg-red-500"
              )}
              style={{ width: `${value}%` }}
            />
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ResourceCard;
