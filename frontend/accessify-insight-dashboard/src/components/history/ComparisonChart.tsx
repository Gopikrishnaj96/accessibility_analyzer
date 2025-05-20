import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HistoryItem {
  id: string;
  url: string;
  date: string;
  accessibilityScore: number;
  performanceScore: number;
  seoScore: number;
  bestPracticesScore: number;
  issuesCount: number;
}

interface ComparisonChartProps {
  title: string;
  description?: string;
  data: HistoryItem[];
}

const ComparisonChart = ({ title, description, data }: ComparisonChartProps) => {
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [previousVersion, setPreviousVersion] = useState<string>('');

  // Get unique dates for the select dropdowns
  const dates = [...new Set(data.map(item => item.date))].sort().reverse();

  // Set initial values when data changes
  React.useEffect(() => {
    if (dates.length >= 2) {
      setCurrentVersion(dates[0]);
      setPreviousVersion(dates[1]);
    }
  }, [dates]);

  // Prepare comparison data
  const comparisonData = React.useMemo(() => {
    if (!currentVersion || !previousVersion) return [];

    const current = data.find(item => item.date === currentVersion);
    const previous = data.find(item => item.date === previousVersion);

    if (!current || !previous) return [];

    return [
      {
        category: 'Accessibility',
        'Current Version': current.accessibilityScore,
        'Previous Version': previous.accessibilityScore,
      },
      {
        category: 'Performance',
        'Current Version': current.performanceScore ?? 0,
        'Previous Version': previous.performanceScore ?? 0,
      },
      {
        category: 'SEO',
        'Current Version': current.seoScore ?? 0,
        'Previous Version': previous.seoScore ?? 0,
      },
      {
        category: 'Best Practices',
        'Current Version': current.bestPracticesScore ?? 0,
        'Previous Version': previous.bestPracticesScore ?? 0,
      },
      {
        category: 'Issues',
        'Current Version': current.issuesCount,
        'Previous Version': previous.issuesCount,
      },
    ];
  }, [data, currentVersion, previousVersion]);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex gap-2 items-center">
            <Select value={currentVersion} onValueChange={setCurrentVersion}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Current Version" />
              </SelectTrigger>
              <SelectContent>
                {dates.map(date => (
                  <SelectItem key={date} value={date}>{date}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <span className="text-muted-foreground">vs</span>
            
            <Select value={previousVersion} onValueChange={setPreviousVersion}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Previous Version" />
              </SelectTrigger>
              <SelectContent>
                {dates.map(date => (
                  <SelectItem key={date} value={date}>{date}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {comparisonData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={comparisonData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card)', 
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem'
                }}
              />
              <Legend />
              <Bar dataKey="Current Version" fill="hsl(var(--primary))" />
              <Bar dataKey="Previous Version" fill="hsl(var(--secondary))" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            Select two different dates to compare results
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ComparisonChart;
