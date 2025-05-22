import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Accessibility, BarChart2, HomeIcon, History, Download } from 'lucide-react';
import { cn } from "@/lib/utils";
import logger from "@/lib/logger";
import { toast } from "sonner";

const MainNav = () => {
  const location = useLocation();
  
  const downloadLogs = () => {
    try {
      const logs = logger.getRecentLogs();
      
      if (logs.length === 0) {
        toast.info('No logs available to download');
        return;
      }
      
      const logsText = JSON.stringify(logs, null, 2);
      const blob = new Blob([logsText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `accessify-logs-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast.success('Debug logs downloaded');
    } catch (e) {
      console.error('Failed to download logs:', e);
      toast.error('Failed to download logs');
    }
  };

  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4 max-w-7xl mx-auto">
        <Link 
          to="/" 
          className="flex items-center gap-2 font-bold text-xl"
        >
          <Accessibility className="h-5 w-5 text-primary" />
          Accessify
        </Link>
        <nav className="flex items-center ml-auto space-x-2">
          <Link to="/" className={cn(
            "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
            location.pathname === "/" 
              ? "bg-accent text-accent-foreground" 
              : "hover:bg-accent/50"
          )}>
            <HomeIcon className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
          
          <Link to="/results" className={cn(
            "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
            location.pathname === "/results" 
              ? "bg-accent text-accent-foreground" 
              : "hover:bg-accent/50"
          )}>
            <BarChart2 className="h-4 w-4 mr-2" />
            Results
          </Link>
          
          <Link to="/history" className={cn(
            "inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
            location.pathname === "/history" 
              ? "bg-accent text-accent-foreground" 
              : "hover:bg-accent/50"
          )}>
            <History className="h-4 w-4 mr-2" />
            History
          </Link>
          
          {process.env.NODE_ENV !== 'production' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:bg-accent/50"
              onClick={downloadLogs}
              title="Download debug logs"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </nav>
      </div>
    </div>
  );
};

export default MainNav;
