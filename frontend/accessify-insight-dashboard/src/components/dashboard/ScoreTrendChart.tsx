import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { getTestHistory } from '@/lib/api';
import { format, parseISO } from 'date-fns';

interface ScoreTrendChartProps {
  title: string;
  description?: string;
  url?: string;
}

const ScoreTrendChart = ({ title, description, url }: ScoreTrendChartProps) => {
  const {
    data: history,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['history', url],
    queryFn: () => (url ? getTestHistory(url) : Promise.resolve([])),
    enabled: !!url,
  });

  // Format data for the chart
  const chartData = history?.map(item => ({
    date: format(parseISO(item.timestamp), 'MMM d'),
    score: item.summary.score,
  })) || [];

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center h-[300px]">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        )}
        
        {isError && (
          <div className="text-center p-8 text-destructive">
            <p>Error loading history data: {error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        )}
        
        {!isLoading && !isError && chartData.length === 0 && (
          <div className="text-center p-8 text-muted-foreground">
            <p>No historical data available for this URL yet.</p>
          </div>
        )}
        
        {!isLoading && !isError && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 5,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" stroke="#888888" />
              <YAxis domain={[0, 100]} stroke="#888888" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card)', 
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ScoreTrendChart;
