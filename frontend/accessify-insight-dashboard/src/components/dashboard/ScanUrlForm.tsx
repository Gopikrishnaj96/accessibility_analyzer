import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { runAccessibilityTest, runLighthouseTest, AccessibilityTestResult, LighthouseTestResult } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';

interface ScanUrlFormProps {
  onScanComplete?: (accessResults: AccessibilityTestResult, lighthouseResults: LighthouseTestResult) => void;
}

const ScanUrlForm = ({ onScanComplete }: ScanUrlFormProps) => {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();
  
  // Clear session storage on component mount to prevent old data from being used
  useEffect(() => {
    try {
      sessionStorage.removeItem('accessibilityResults');
      sessionStorage.removeItem('lighthouseResults');
    } catch (e) {
      console.error('Failed to clear session storage:', e);
    }
  }, []);
  
  const accessibilityMutation = useMutation({
    mutationFn: (url: string) => runAccessibilityTest({
      url,
      options: {
        rules: ["color-contrast", "heading-order"]
      },
      enhanced: true
    }),
    onError: (error: any) => {
      console.error('Accessibility scan error:', error);
    }
  });
  
  const lighthouseMutation = useMutation({
    mutationFn: (url: string) => runLighthouseTest({ url }),
    onError: (error: any) => {
      console.error('Lighthouse scan error:', error);
    }
  });
  
  const isLoading = accessibilityMutation.isPending || lighthouseMutation.isPending;

  // Process and validate URL
  const processUrl = (inputUrl: string): string | null => {
    if (!inputUrl) return null;
    
    const trimmedUrl = inputUrl.trim();
    if (!trimmedUrl) return null;
    
    // Add https:// prefix if not present
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      return `https://${trimmedUrl}`;
    }
    
    return trimmedUrl;
  };

  // Safely store results in session storage
  const safelyStoreResults = (key: string, data: any): boolean => {
    try {
      const serialized = JSON.stringify(data);
      sessionStorage.setItem(key, serialized);
      return true;
    } catch (e) {
      console.error(`Failed to store ${key}:`, e);
      return false;
    }
  };

  // Safely validate minimal structure of test results
  const validateResults = (data: any, type: 'accessibility' | 'lighthouse'): boolean => {
    try {
      if (!data || typeof data !== 'object') {
        console.error(`Invalid ${type} results: not an object`, data);
        return false;
      }
      
      if (type === 'accessibility' && !data.id) {
        console.error('Invalid accessibility results: missing ID', data);
        return false;
      }
      
      if (type === 'lighthouse' && !data.url) {
        console.error('Invalid lighthouse results: missing URL', data);
        return false;
      }
      
      return true;
    } catch (e) {
      console.error(`Error validating ${type} results:`, e);
      return false;
    }
  };
  
  // Main form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Input validation
    const processedUrl = processUrl(url);
    if (!processedUrl) {
      toast.error('Please enter a valid URL');
      return;
    }
    
    // Notify user with the processed URL
    if (processedUrl !== url.trim()) {
      toast.info(`Using URL: ${processedUrl}`);
    }
    
    // Clear previous results first
    try {
      sessionStorage.removeItem('accessibilityResults');
      sessionStorage.removeItem('lighthouseResults');
    } catch (e) {
      console.error('Failed to clear session storage:', e);
    }
    
    toast.info(`Starting scan for ${processedUrl}...`);
    
    try {
      // Run accessibility test with defensive error handling
      let accessResults: AccessibilityTestResult | null = null;
      try {
        accessResults = await accessibilityMutation.mutateAsync(processedUrl);
        console.log('Received accessibility results:', accessResults);
        
        if (!validateResults(accessResults, 'accessibility')) {
          throw new Error('Invalid accessibility test results received');
        }
        
        if (!safelyStoreResults('accessibilityResults', accessResults)) {
          throw new Error('Failed to store accessibility results');
        }
        
        toast.success('Accessibility scan completed');
      } catch (error) {
        console.error('Accessibility scan failed:', error);
        // If server error, show a specific message but continue with lighthouse test
        if ((error as any)?.status === 500 || (error as any)?.isServerError) {
          toast.error('Accessibility scan failed with server error. Continuing with performance scan...');
        } else {
          // For other errors, abort the entire scan
          throw error;
        }
      }
      
      // Run lighthouse test with defensive error handling
      let lighthouseResults: LighthouseTestResult | null = null;
      try {
        lighthouseResults = await lighthouseMutation.mutateAsync(processedUrl);
        console.log('Received lighthouse results:', lighthouseResults);
        
        if (!validateResults(lighthouseResults, 'lighthouse')) {
          throw new Error('Invalid lighthouse test results received');
        }
        
        if (!safelyStoreResults('lighthouseResults', lighthouseResults)) {
          throw new Error('Failed to store lighthouse results');
        }
        
        toast.success('Performance scan completed');
      } catch (error) {
        console.error('Lighthouse scan failed:', error);
        // If server error, show message but try to continue if we have accessibility results
        if ((error as any)?.status === 500 || (error as any)?.isServerError) {
          toast.error('Performance scan failed with server error.');
          // Only continue if we have accessibility results
          if (!accessResults) {
            throw new Error('Both scans failed. Please try again.');
          }
        } else {
          // For other errors, abort if we don't have accessibility results
          if (!accessResults) {
            throw error;
          }
          toast.error('Performance scan failed, but accessibility results are available.');
        }
      }
      
      // Check if we have at least one set of results
      if (!accessResults && !lighthouseResults) {
        throw new Error('Both scans failed to produce valid results');
      }
      
      toast.success(`Analysis complete for ${processedUrl}`);
      
      // If a callback is provided, call it with the results
      if (onScanComplete && accessResults && lighthouseResults) {
        onScanComplete(accessResults, lighthouseResults);
      } else {
        // Navigate to results page - delay to allow toasts to be seen
        setTimeout(() => navigate('/results'), 800);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred';
      
      // Format a more user-friendly error message
      let userErrorMsg = errorMsg;
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        userErrorMsg = 'Network error: Unable to connect to the server. Please check your internet connection.';
      } else if ((error as any)?.status === 500 || (error as any)?.isServerError) {
        userErrorMsg = 'Server error: The analysis service is currently experiencing issues. Please try again later.';
      }
      
      toast.error(`Scan failed: ${userErrorMsg}`);
      console.error('Complete scan error details:', error);
      
      // Clean up any partial results
      try {
        sessionStorage.removeItem('accessibilityResults');
        sessionStorage.removeItem('lighthouseResults');
      } catch (e) {
        console.error('Failed to clear session storage after error:', e);
      }
    }
  };

  return (
    <ErrorBoundary>
      <form onSubmit={handleSubmit} className="rounded-xl bg-gradient-to-br from-accent to-accent/20 p-6 shadow-sm border border-accent/50">
        <h2 className="text-2xl font-bold mb-4">Scan Your Website</h2>
        <p className="mb-4 text-muted-foreground">
          Enter your website URL to analyze its accessibility and performance.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            type="text"
            placeholder="https://www.example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-grow w-full bg-background"
            disabled={isLoading}
            aria-label="Website URL"
          />
          <Button type="submit" disabled={isLoading || !url.trim()} className="whitespace-nowrap">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Scanning...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Run Analysis
              </span>
            )}
          </Button>
        </div>
        {isLoading && (
          <p className="mt-3 text-sm text-muted-foreground">
            Analysis in progress. This might take up to 30 seconds depending on the website complexity...
          </p>
        )}
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Having issues? Try:</p>
          <ul className="list-disc pl-5 mt-1">
            <li>Using a fully qualified URL (including https://)</li> 
            <li>Checking if the website is publicly accessible</li>
            <li>Trying again in a few minutes if you see a server error</li>
          </ul>
        </div>
      </form>
    </ErrorBoundary>
  );
};

export default ScanUrlForm;
