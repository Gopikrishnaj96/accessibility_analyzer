import React, { useState } from 'react';
import MainNav from '@/components/layout/MainNav';
import PageContainer from '@/components/layout/PageContainer';
import ScanUrlForm from '@/components/dashboard/ScanUrlForm';
import ScoreCard from '@/components/dashboard/ScoreCard';
import ScoreTrendChart from '@/components/dashboard/ScoreTrendChart';
import { Accessibility, BarChart, Search, LineChart } from 'lucide-react';
import { AccessibilityTestResult, LighthouseTestResult } from '@/lib/api';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [latestScan, setLatestScan] = useState<{
    url: string;
    date: string;
    accessibilityScore: number;
    lighthouseScores: {
      performance: number;
      seo: number;
      bestPractices: number;
    };
  } | null>(null);

  const handleScanComplete = (
    accessResults: AccessibilityTestResult,
    lighthouseResults: LighthouseTestResult
  ) => {
    // Safely get accessibility score from either format (summary or axeSummary)
    const accessibilityScore = accessResults.axeSummary?.score ?? 
                              accessResults.summary?.score ?? 
                              0;
                              
    setLatestScan({
      url: accessResults.url,
      date: new Date(accessResults.timestamp).toLocaleDateString(),
      accessibilityScore: accessibilityScore,
      lighthouseScores: {
        performance: lighthouseResults?.scores?.performance ?? 0,
        seo: lighthouseResults?.scores?.seo ?? 0,
        bestPractices: lighthouseResults?.scores?.bestPractices ?? 0,
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <MainNav />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <PageContainer
          title="Accessibility Dashboard"
          description="Monitor and improve your website's accessibility"
        >
          <div className="mb-8">
            <ScanUrlForm onScanComplete={handleScanComplete} />
          </div>

          {latestScan && (
            <>
              <h3 className="text-xl font-semibold mb-4">Latest Results for {latestScan.url}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <ScoreCard 
                  title="Accessibility" 
                  score={latestScan.accessibilityScore} 
                  icon={<Accessibility className="h-5 w-5" />}
                  description="WCAG 2.1 compliance"
                />
                <ScoreCard 
                  title="Performance" 
                  score={latestScan.lighthouseScores.performance} 
                  icon={<BarChart className="h-5 w-5" />}
                  description="Page speed & loading"
                />
                <ScoreCard 
                  title="SEO" 
                  score={latestScan.lighthouseScores.seo} 
                  icon={<Search className="h-5 w-5" />}
                  description="Search engine optimization"
                />
                <ScoreCard 
                  title="Best Practices" 
                  score={latestScan.lighthouseScores.bestPractices} 
                  icon={<LineChart className="h-5 w-5" />}
                  description="Web development standards"
                />
              </div>

              <ScoreTrendChart 
                title="Accessibility Score Trend" 
                description="Track your website's accessibility improvement over time"
                url={latestScan.url}
              />
            </>
          )}
          
          {!latestScan && (
            <div className="text-center p-12 border border-dashed rounded-lg bg-muted/20">
              <h3 className="text-xl font-semibold mb-2">No Results Yet</h3>
              <p className="text-muted-foreground">
                Enter a URL above and run an analysis to see results here.
              </p>
            </div>
          )}
        </PageContainer>
      </motion.div>
    </div>
  );
};

export default Dashboard;
