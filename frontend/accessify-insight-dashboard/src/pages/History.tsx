import React from 'react';
import MainNav from '@/components/layout/MainNav';
import PageContainer from '@/components/layout/PageContainer';
import TestHistoryTable from '@/components/history/TestHistoryTable';
import ComparisonChart from '@/components/history/ComparisonChart';
import { useQuery } from '@tanstack/react-query';
import { getTestHistory } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';

const History = () => {
  const { 
    data: history, 
    isLoading, 
    error, 
    refetch,
    isError
  } = useQuery({
    queryKey: ['history'],
    queryFn: () => getTestHistory(''),
    retry: 2,
    retryDelay: attempt => Math.min(1000 * (2 ** attempt), 30000)
  });

  // Group and deduplicate history items by URL and date
  const transformedHistory = React.useMemo(() => {
    if (!history || !Array.isArray(history)) return [];

    // Create a map to store the most complete entry for each URL-date combination
    const urlDateMap = new Map();
    
    // Process each history item
    history.forEach(item => {
      const date = format(parseISO(item.timestamp), 'MMM d, yyyy');
      const key = `${item.url}-${date}`;
      
      // Calculate scores for this item
      const accessibilityScore = Math.round((item.axeSummary?.score ?? item.summary?.score ?? 0) * 100);
      const performanceScore = Math.round(item.lighthouseScores?.performance * 100 || item.lighthouseResults?.scores?.performance * 100) || 0;
      const seoScore = Math.round(item.lighthouseScores?.seo * 100 || item.lighthouseResults?.scores?.seo * 100) || 0;
      const bestPracticesScore = Math.round(item.lighthouseScores?.bestPractices * 100 || item.lighthouseResults?.scores?.bestPractices * 100) || 0;
      const issuesCount = item.axeSummary?.violations ?? item.summary?.violations ?? 0;
      
      // If we already have an entry for this URL-date, merge with it if this entry has more data
      if (urlDateMap.has(key)) {
        const existingItem = urlDateMap.get(key);
        
        // Only update if this entry has higher scores (suggesting more complete data)
        if (
          performanceScore > existingItem.performanceScore ||
          accessibilityScore > existingItem.accessibilityScore ||
          seoScore > existingItem.seoScore ||
          bestPracticesScore > existingItem.bestPracticesScore
        ) {
          urlDateMap.set(key, {
            id: item.id,
            url: item.url,
            date,
            accessibilityScore: Math.max(accessibilityScore, existingItem.accessibilityScore),
            performanceScore: Math.max(performanceScore, existingItem.performanceScore),
            seoScore: Math.max(seoScore, existingItem.seoScore),
            bestPracticesScore: Math.max(bestPracticesScore, existingItem.bestPracticesScore),
            issuesCount: Math.max(issuesCount, existingItem.issuesCount)
          });
        }
      } else {
        // First time seeing this URL-date, add it to the map
        urlDateMap.set(key, {
          id: item.id,
          url: item.url,
          date,
          accessibilityScore,
          performanceScore,
          seoScore,
          bestPracticesScore,
          issuesCount
        });
      }
    });
    
    // Convert the map values to an array and sort by date (newest first)
    return Array.from(urlDateMap.values())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [history]);

  // Check if the error is a server error (status 500)
  const isServerError = error && ((error as any).status === 500 || (error as any).message?.includes('server'));

  return (
    <div className="min-h-screen flex flex-col">
      <MainNav />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <PageContainer
          title="Test History"
          description="View and compare your accessibility test results over time"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : isServerError ? (
            <Card className="p-6 border-red-200 bg-red-50">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <h3 className="font-medium">Server Error</h3>
                </div>
                <p className="text-red-600">The analysis service is currently experiencing issues. Your data is safe but cannot be retrieved right now.</p>
                <Button 
                  onClick={() => refetch()} 
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            </Card>
          ) : error ? (
            <div className="text-center p-8 text-destructive">
              <p>Error loading history data: {error instanceof Error ? error.message : 'Unknown error'}</p>
              <Button 
                onClick={() => refetch()} 
                className="mt-4 flex items-center gap-2"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : transformedHistory.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>No test history available yet.</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <ComparisonChart 
                  title="Comparison Chart" 
                  description="Compare results between different test runs"
                  data={transformedHistory}
                />
              </div>

              <div className="border rounded-lg overflow-hidden">
                <TestHistoryTable history={transformedHistory} />
              </div>
            </>
          )}
        </PageContainer>
      </motion.div>
    </div>
  );
};

export default History;
