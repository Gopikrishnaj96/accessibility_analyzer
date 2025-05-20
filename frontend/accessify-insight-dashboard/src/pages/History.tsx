import React from 'react';
import MainNav from '@/components/layout/MainNav';
import PageContainer from '@/components/layout/PageContainer';
import TestHistoryTable from '@/components/history/TestHistoryTable';
import ComparisonChart from '@/components/history/ComparisonChart';
import { useQuery } from '@tanstack/react-query';
import { getTestHistory } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

const History = () => {
  const { data: history, isLoading, error } = useQuery({
    queryKey: ['history'],
    queryFn: () => getTestHistory(''),
  });

  // Transform the API data to match the table format
  const transformedHistory = history?.map(item => ({
    id: item.id,
    url: item.url,
    date: format(parseISO(item.timestamp), 'MMM d, yyyy'),
    accessibilityScore: Math.round(item.summary.score * 100),
    performanceScore: Math.round(item.lighthouseResults?.scores?.performance * 100) || 0,
    seoScore: Math.round(item.lighthouseResults?.scores?.seo * 100) || 0,
    bestPracticesScore: Math.round(item.lighthouseResults?.scores?.bestPractices * 100) || 0,
    issuesCount: item.summary.violations
  })) || [];

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
          ) : error ? (
            <div className="text-center p-8 text-destructive">
              <p>Error loading history data: {error instanceof Error ? error.message : 'Unknown error'}</p>
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
