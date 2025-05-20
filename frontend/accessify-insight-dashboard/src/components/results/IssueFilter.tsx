
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface IssueFilterProps {
  onFilterChange: (filters: {
    impact: string;
    wcagLevel: string;
    engine: string;
  }) => void;
}

const IssueFilter = ({ onFilterChange }: IssueFilterProps) => {
  const [impact, setImpact] = useState('all');
  const [wcagLevel, setWcagLevel] = useState('all');
  const [engine, setEngine] = useState('all');

  const handleImpactChange = (value: string) => {
    setImpact(value);
    onFilterChange({ impact: value, wcagLevel, engine });
  };

  const handleWcagLevelChange = (value: string) => {
    setWcagLevel(value);
    onFilterChange({ impact, wcagLevel: value, engine });
  };

  const handleEngineChange = (value: string) => {
    setEngine(value);
    onFilterChange({ impact, wcagLevel, engine: value });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 border rounded-lg bg-card">
      <div className="flex-1">
        <div className="text-sm font-medium mb-2">Impact Level</div>
        <Tabs defaultValue="all" value={impact} onValueChange={handleImpactChange}>
          <TabsList className="grid grid-cols-3 md:grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="critical">Critical</TabsTrigger>
            <TabsTrigger value="serious">Serious</TabsTrigger>
            <TabsTrigger value="moderate">Moderate</TabsTrigger>
            <TabsTrigger value="minor">Minor</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-1 flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="text-sm font-medium mb-2">WCAG Level</div>
          <Select value={wcagLevel} onValueChange={handleWcagLevelChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="AA">AA</SelectItem>
              <SelectItem value="AAA">AAA</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <div className="text-sm font-medium mb-2">Test Engine</div>
          <Select value={engine} onValueChange={handleEngineChange}>
            <SelectTrigger>
              <SelectValue placeholder="All Engines" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Engines</SelectItem>
              <SelectItem value="axe">Axe Core</SelectItem>
              <SelectItem value="lighthouse">Lighthouse</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default IssueFilter;
