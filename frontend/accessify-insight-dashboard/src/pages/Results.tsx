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
      const storedAccessResults = sessionStorage.getItem('accessibilityResults');
      const storedLighthouseResults = sessionStorage.getItem('lighthouseResults');
      
      if (!storedAccessResults || !storedLighthouseResults) {
        toast.error('No scan results found');
        navigate('/');
        return;
      }

      const parsedAccessResults = JSON.parse(storedAccessResults);
      const parsedLighthouseResults = JSON.parse(storedLighthouseResults);
      
      if (!parsedAccessResults || !parsedLighthouseResults) {
        toast.error('Invalid scan results format');
        navigate('/');
        return;
      }

      setAccessResults(parsedAccessResults);
      setLighthouseResults(parsedLighthouseResults);
    } catch (err) {
      console.error('Error loading results:', err);
      setError(err instanceof Error ? err.message : 'Failed to load results');
      toast.error('Failed to load scan results');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);
  
  useEffect(() => {
    loadResults();
    
    // Add event listener for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessibilityResults' || e.key === 'lighthouseResults') {
        loadResults();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Set up an interval to check for updates
    const checkInterval = setInterval(() => {
      const currentAccessResults = sessionStorage.getItem('accessibilityResults');
      const currentLighthouseResults = sessionStorage.getItem('lighthouseResults');
      
      if (currentAccessResults && currentLighthouseResults) {
        const parsedAccess = JSON.parse(currentAccessResults);
        const parsedLighthouse = JSON.parse(currentLighthouseResults);
        
        // Only update if the results are different
        if (JSON.stringify(parsedAccess) !== JSON.stringify(accessResults) ||
            JSON.stringify(parsedLighthouse) !== JSON.stringify(lighthouseResults)) {
          setAccessResults(parsedAccess);
          setLighthouseResults(parsedLighthouse);
        }
      }
    }, 1000); // Check every second
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkInterval);
    };
  }, [loadResults, location.key]);

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

  if (error || !accessResults) {
    return (
      <div className="min-h-screen flex flex-col">
        <MainNav />
        <PageContainer title="Error">
          <div className="text-center p-8 text-destructive">
            <p>{error || 'Failed to load results'}</p>
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

  return (
    <div className="min-h-screen flex flex-col">
      <MainNav />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <PageContainer
          title="Analysis Results"
          description={`${accessResults.url} - ${new Date(accessResults.timestamp).toLocaleString()}`}
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
          
          <Tabs defaultValue="accessibility" className="w-full">
            <TabsList className="grid grid-cols-2 mb-6 w-[400px] max-w-full">
              <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="accessibility" className="space-y-6">
              <AccessibilityDetails results={accessResults} />
            </TabsContent>
            
            <TabsContent value="performance" className="space-y-6">
              <PerformanceDetails results={lighthouseResults} />
            </TabsContent>
          </Tabs>
        </PageContainer>
      </motion.div>
    </div>
  );
};

export default Results;
