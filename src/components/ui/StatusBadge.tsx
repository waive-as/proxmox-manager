
import React from "react";
import { Badge } from "@/components/ui/badge";
import { VMStatus } from "@/services/api";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: VMStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusColor = (status: VMStatus): string => {
    switch (status) {
      case "running":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
      case "stopped":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      case "paused":
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
      case "error":
        return "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusText = (status: VMStatus): string => {
    switch (status) {
      case "running":
        return "Running";
      case "stopped":
        return "Stopped";
      case "paused":
        return "Paused";
      case "error":
        return "Error";
      default:
        return "Unknown";
    }
  };

  const getAnimationClass = (status: VMStatus): string => {
    return status === "running" ? "animate-pulse-slow" : "";
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-normal",
        getStatusColor(status),
        getAnimationClass(status)
      )}
    >
      {getStatusText(status)}
    </Badge>
  );
};

export default StatusBadge;
