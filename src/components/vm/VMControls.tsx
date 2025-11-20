
import React from "react";
import { Button } from "@/components/ui/button";
import { VMStatus } from "@/services/api";
import { Play, Square, RotateCw, Pause, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VMControlsProps {
  status: VMStatus;
  onAction: (action: 'start' | 'stop' | 'reboot' | 'pause' | 'resume') => void;
  loading: boolean;
  isReadOnly: boolean;
}

const VMControls: React.FC<VMControlsProps> = ({ status, onAction, loading, isReadOnly }) => {
  const renderControls = () => {
    if (isReadOnly) {
      return (
        <p className="text-xs text-muted-foreground italic">Read-only access</p>
      );
    }

    if (loading) {
      return (
        <Button variant="outline" className="w-full" disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </Button>
      );
    }

    switch (status) {
      case "running":
        return (
          <div className="flex space-x-2 w-full">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-1 hover:bg-amber-500/10 hover:text-amber-500 transition-colors"
                    onClick={() => onAction("reboot")}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reboot VM</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-1 hover:bg-yellow-500/10 hover:text-yellow-500 transition-colors"
                    onClick={() => onAction("pause")}
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Pause VM</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-1 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                    onClick={() => onAction("stop")}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Stop VM</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );

      case "stopped":
        return (
          <Button
            variant="outline"
            className="w-full text-green-500 hover:text-green-600 hover:bg-green-50 hover:border-green-200 transition-colors"
            onClick={() => onAction("start")}
          >
            <Play className="h-4 w-4 mr-2" />
            Start
          </Button>
        );

      case "paused":
        return (
          <Button
            variant="outline"
            className="w-full text-blue-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-colors"
            onClick={() => onAction("resume")}
          >
            <Play className="h-4 w-4 mr-2" />
            Resume
          </Button>
        );

      default:
        return (
          <Button variant="outline" className="w-full" disabled>
            Not Available
          </Button>
        );
    }
  };

  return <div className="w-full">{renderControls()}</div>;
};

export default VMControls;
