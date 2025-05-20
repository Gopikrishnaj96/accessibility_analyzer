
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Accessibility, BarChart2, HomeIcon, History } from 'lucide-react';

const MainNav = () => {
  return (
    <nav className="flex py-4 px-6 border-b">
      <div className="flex items-center mr-6">
        <Accessibility className="h-6 w-6 text-primary mr-2" />
        <h1 className="font-semibold text-xl">AccessAnalyzer</h1>
      </div>
      <div className="flex gap-1 items-center">
        <Button variant="ghost" asChild>
          <Link to="/" className="flex items-center gap-1">
            <HomeIcon className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link to="/results" className="flex items-center gap-1">
            <BarChart2 className="h-4 w-4" />
            <span>Results</span>
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link to="/history" className="flex items-center gap-1">
            <History className="h-4 w-4" />
            <span>History</span>
          </Link>
        </Button>
      </div>
    </nav>
  );
};

export default MainNav;
