import { RefreshCw } from "lucide-react";
import { Button } from "./button";

interface AutoRefreshIndicatorProps {
  refreshing: boolean;
  autoRefreshPaused: boolean;
  lastRefresh: Date;
  onManualRefresh: () => void;
  showButton?: boolean;
  showStatus?: boolean;
  className?: string;
}

export function AutoRefreshIndicator({
  refreshing,
  autoRefreshPaused,
  lastRefresh,
  onManualRefresh,
  showButton = true,
  showStatus = true,
  className = ""
}: AutoRefreshIndicatorProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showStatus && (
        <>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${autoRefreshPaused ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <span className="text-xs text-muted-foreground">
              {autoRefreshPaused ? 'Auto-refresh paused' : 'Auto-refresh active'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
        </>
      )}
      {showButton && (
        <Button 
          variant="outline" 
          size="sm"
          onClick={onManualRefresh}
          disabled={refreshing}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      )}
    </div>
  );
} 