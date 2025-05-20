import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { runAccessibilityTest, runLighthouseTest, AccessibilityTestResult, LighthouseTestResult } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

interface ScanUrlFormProps {
  onScanComplete?: (accessResults: AccessibilityTestResult, lighthouseResults: LighthouseTestResult) => void;
}

const ScanUrlForm = ({ onScanComplete }: ScanUrlFormProps) => {
  const [url, setUrl] = useState('');
  const navigate = useNavigate();
  
  const accessibilityMutation = useMutation({
    mutationFn: (url: string) => runAccessibilityTest({
      url,
      options: {
        rules: ["color-contrast", "heading-order"]
      },
      enhanced: true
    }),
  });
  
  const lighthouseMutation = useMutation({
    mutationFn: (url: string) => runLighthouseTest({ url }),
  });
  
  const isLoading = accessibilityMutation.isPending || lighthouseMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url) {
      toast.error('Please enter a URL');
      return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error('Please enter a valid URL starting with http:// or https://');
      return;
    }
    
    toast.info(`Starting scan for ${url}...`);
    
    try {
      // Run both tests in parallel
      const [accessResults, lighthouseResults] = await Promise.all([
        accessibilityMutation.mutateAsync(url),
        lighthouseMutation.mutateAsync(url)
      ]);
      
      // Validate the results before storing
      if (!accessResults || !lighthouseResults) {
        throw new Error('Invalid test results received');
      }
      
      // Store results in sessionStorage
      try {
        sessionStorage.setItem('accessibilityResults', JSON.stringify(accessResults));
        sessionStorage.setItem('lighthouseResults', JSON.stringify(lighthouseResults));
      } catch (storageError) {
        console.error('Error storing results:', storageError);
        throw new Error('Failed to store test results');
      }
      
      toast.success(`Scan completed for ${url}`);
      
      // If a callback is provided, call it with the results
      if (onScanComplete) {
        onScanComplete(accessResults, lighthouseResults);
      } else {
        // Navigate to results page
        navigate('/results');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Scan failed: ${errorMsg}`);
      console.error('Scan error:', error);
    }
  };

  return (
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
        />
        <Button type="submit" disabled={isLoading} className="whitespace-nowrap">
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
    </form>
  );
};

export default ScanUrlForm;
