import { toast } from "sonner";
import logger from './logger';

// Types
export interface AccessibilityTestOptions {
  url: string;
  options?: {
    rules?: string[];
  };
  enhanced?: boolean;
}

export interface LighthouseTestOptions {
  url: string;
}

export interface AccessibilityTestResult {
  id: string;
  url: string;
  timestamp: string;
  testType?: string;
  summary?: {
    violations: number;
    passes: number;
    incomplete: number;
    inapplicable: number;
    score: number;
  };
  results?: {
    violations: AccessibilityIssue[];
    passes: AccessibilityIssue[];
    incomplete: AccessibilityIssue[];
    inapplicable: AccessibilityIssue[];
  };
  lighthouseResults?: LighthouseTestResult;
  lighthouseScores?: {
    performance: number;
    accessibility: number;
    seo: number;
    bestPractices: number;
  };
  axeSummary?: {
    score: number;
    violations: number;
  };
}

export interface AccessibilityIssue {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor' | null;
  tags: string[];
  description: string;
  help: string;
  helpUrl: string;
  nodes: AccessibilityNode[];
}

export interface AccessibilityNode {
  html: string;
  target: string[];
  failureSummary?: string;
  impact?: 'critical' | 'serious' | 'moderate' | 'minor' | null;
  any?: AccessibilityNodeCheck[];
  all?: AccessibilityNodeCheck[];
  none?: AccessibilityNodeCheck[];
}

export interface AccessibilityNodeCheck {
  id: string;
  data: {
    [key: string]: any;
    bgColor?: string;
    color?: string;
    contrastRatio?: number;
    fontSize?: string;
    messageKey?: string;
    expectedContrastRatio?: string;
  };
  impact?: 'critical' | 'serious' | 'moderate' | 'minor' | null;
  message: string;
  relatedNodes?: AccessibilityRelatedNode[];
}

export interface AccessibilityRelatedNode {
  html: string;
  target: string[];
}

export interface LighthouseTestResult {
  url: string;
  scores: {
    accessibility: number;
    performance: number;
    seo: number;
    bestPractices: number;
  };
  audits: {
    [key: string]: LighthouseAudit;
  };
  timing: {
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    timeToInteractive: number;
    speedIndex: number;
    totalBlockingTime: number;
    cumulativeLayoutShift: number;
  };
  screenshots?: {
    thumbnails: string[];
    fullPageScreenshot?: string;
  };
  resources: {
    total: number;
    byType: {
      [key: string]: number; // document, script, stylesheet, image, etc.
    };
    transferSize: number;
  };
  errors?: string[];
  timestamp: string;
}

export interface LighthouseAudit {
  id: string;
  title: string;
  description: string;
  score: number | null;
  scoreDisplayMode: string;
  displayValue?: string;
  details?: {
    type: string;
    items?: any[];
    headings?: any[];
    overallSavingsMs?: number;
    overallSavingsBytes?: number;
    [key: string]: any;
  };
}

// API base URL
const API_BASE_URL = 'http://localhost:3001/api';

// Helper function for API calls
async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  logger.debug(`API request to ${url}`, { method: options?.method || 'GET' });
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    logger.debug(`API response from ${url}`, { status: response.status });

    if (!response.ok) {
      // Extract detailed error information
      let errorMessage = `API error: ${response.status}`;
      let errorData: any = {};
      
      try {
        errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Failed to parse JSON, use status text instead
        errorMessage = `${errorMessage} (${response.statusText})`;
        logger.warn('Failed to parse error response as JSON', { url, status: response.status });
      }
      
      // Create an enhanced error object
      const error: any = new Error(errorMessage);
      error.status = response.status;
      error.statusText = response.statusText;
      error.url = url;
      error.data = errorData;
      
      // Special handling for 500 errors
      if (response.status === 500) {
        error.message = 'Server error: The analysis service is currently experiencing issues. Please try again later.';
        error.isServerError = true;
      }
      
      logger.error(`API error: ${errorMessage}`, { 
        url, 
        status: response.status, 
        data: errorData 
      });
      
      throw error;
    }

    // Parse response data
    try {
      const data = await response.json();
      logger.debug('API response data received', { url });
      return data;
    } catch (e) {
      logger.error('Failed to parse API response as JSON', { url, error: e });
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    logger.logError(error, `API call to ${url} failed`);
    
    // Format error message
    let errorMsg = error instanceof Error ? error.message : 'Unknown error';
    if ((error as any).status === 500) {
      errorMsg = 'Server error: The analysis service is currently experiencing issues. Please try again later.';
    }
    
    toast.error(errorMsg);
    throw error;
  }
}

// Helper function to retry API calls with backoff
async function retryApiCall<T>(
  apiFn: () => Promise<T>, 
  maxRetries = 2, 
  initialDelay = 1000
): Promise<T> {
  let retries = 0;
  let lastError: any;

  while (retries <= maxRetries) {
    try {
      return await apiFn();
    } catch (error) {
      lastError = error;
      
      // Only retry on server errors (500)
      if (retries >= maxRetries || !((error as any).status === 500 || (error as any).isServerError)) {
        throw error;
      }
      
      // Exponential backoff
      const delay = initialDelay * Math.pow(2, retries);
      logger.info(`API call failed with server error, retrying in ${delay}ms (attempt ${retries + 1}/${maxRetries})`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }
  }
  
  throw lastError;
}

// API functions
export async function runAccessibilityTest(options: AccessibilityTestOptions): Promise<AccessibilityTestResult> {
  const queryParams = options.enhanced ? '?enhanced=true' : '';
  logger.info('Running accessibility test', { url: options.url });
  
  return retryApiCall(() => apiCall<AccessibilityTestResult>(`${API_BASE_URL}/test${queryParams}`, {
    method: 'POST',
    body: JSON.stringify({
      url: options.url,
      options: options.options || {},
    }),
  }));
}

export async function runLighthouseTest(options: LighthouseTestOptions): Promise<LighthouseTestResult> {
  logger.info('Running lighthouse test', { url: options.url });
  
  return retryApiCall(() => apiCall<LighthouseTestResult>(`${API_BASE_URL}/test/lighthouse`, {
    method: 'POST',
    body: JSON.stringify({
      url: options.url,
    }),
  }));
}

export async function getTestHistory(url: string): Promise<AccessibilityTestResult[]> {
  const encodedUrl = encodeURIComponent(url);
  logger.info('Fetching test history', { url });
  
  return retryApiCall(() => apiCall<AccessibilityTestResult[]>(`${API_BASE_URL}/test/history/${encodedUrl}`));
}

// Utility function to encode URLs for API calls
export function encodeUrl(url: string): string {
  return encodeURIComponent(url);
} 