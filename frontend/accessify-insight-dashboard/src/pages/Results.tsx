import React, { useState, useEffect, useCallback } from 'react';
import MainNav from '@/components/layout/MainNav';
import PageContainer from '@/components/layout/PageContainer';
import { useNavigate, useLocation } from 'react-router-dom';
import { AccessibilityTestResult, LighthouseTestResult } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AccessibilityDetails from '@/components/results/AccessibilityDetails';
import PerformanceDetails from '@/components/results/PerformanceDetails';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import ErrorBoundary from '@/components/ErrorBoundary';

const Results = () => {
  const [accessResults, setAccessResults] = useState<AccessibilityTestResult | null>(null);
  const [lighthouseResults, setLighthouseResults] = useState<LighthouseTestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const loadResults = useCallback(() => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Safely get and parse data from session storage
      const safeGetStorageItem = (key: string) => {
        try {
          const item = sessionStorage.getItem(key);
          if (!item) return null;
          
          try {
            return JSON.parse(item);
          } catch (parseError) {
            console.error(`Error parsing ${key} from session storage:`, parseError);
            return null;
          }
        } catch (e) {
          console.error(`Error accessing ${key} from session storage:`, e);
          return null;
        }
      };
      
      const parsedAccessResults = safeGetStorageItem('accessibilityResults');
      const parsedLighthouseResults = safeGetStorageItem('lighthouseResults');
      
      // Check if we have at least one type of results
      if (!parsedAccessResults && !parsedLighthouseResults) {
        setError('No scan results found. Please run a scan first.');
        toast.error('No scan results found');
        navigate('/');
        return;
      }
      
      // Update state with the parsed results
      if (parsedAccessResults && typeof parsedAccessResults === 'object') {
        setAccessResults(parsedAccessResults);
      }
      
      if (parsedLighthouseResults && typeof parsedLighthouseResults === 'object') {
        setLighthouseResults(parsedLighthouseResults);
      }
      
      // Show notification if we only have partial results
      if (parsedAccessResults && !parsedLighthouseResults) {
        toast.warning('Only accessibility results are available');
      } else if (!parsedAccessResults && parsedLighthouseResults) {
        toast.warning('Only performance results are available');
      }
    } catch (err) {
      console.error('Error loading results:', err);
      setError('Failed to load results. Please try running a new scan.');
      toast.error('Failed to load scan results');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);
  
  useEffect(() => {
    loadResults();
  }, [loadResults, location.key]);

  // Render the appropriate UI based on the current state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainNav />
        <PageContainer title="Loading Results...">
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (error && !accessResults && !lighthouseResults) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainNav />
        <PageContainer title="Error">
          <div className="text-center p-8 text-destructive">
            <p>{error}</p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="mt-4"
            >
              Return to Dashboard
            </Button>
          </div>
        </PageContainer>
      </div>
    );
  }

  // Get the URL and timestamp for display
  const url = accessResults?.url || lighthouseResults?.url || 'Unknown URL';
  const timestamp = accessResults?.timestamp || lighthouseResults?.timestamp || new Date().toISOString();

  // Set default active tab based on available data
  const defaultTab = accessResults ? 'accessibility' : 'performance';

  return (
    <div className="min-h-screen flex flex-col">
      <MainNav />
      <ErrorBoundary>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <PageContainer
            title="Analysis Results"
            description={`${url} - ${new Date(timestamp).toLocaleString()}`}
          >
            <div className="mb-6">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/')}
                className="flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </div>
            
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-6 w-[400px] max-w-full">
                <TabsTrigger 
                  value="accessibility" 
                  disabled={!accessResults}
                  title={!accessResults ? "No accessibility data available" : ""}
                >
                  Accessibility
                </TabsTrigger>
                <TabsTrigger 
                  value="performance" 
                  disabled={!lighthouseResults}
                  title={!lighthouseResults ? "No performance data available" : ""}
                >
                  Performance
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="accessibility" className="space-y-6">
                {accessResults ? (
                  <AccessibilityDetails results={accessResults} />
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <p>No accessibility data available for this scan.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="performance" className="space-y-6">
                <PerformanceDetails results={lighthouseResults} />
              </TabsContent>
            </Tabs>
          </PageContainer>
        </motion.div>
      </ErrorBoundary>
    </div>
  );
};

export default Results;
