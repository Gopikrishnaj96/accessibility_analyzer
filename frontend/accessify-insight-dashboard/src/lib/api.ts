import { toast } from "sonner";

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
  summary: {
    violations: number;
    passes: number;
    incomplete: number;
    inapplicable: number;
    score: number;
  };
  results: {
    violations: AccessibilityIssue[];
    passes: AccessibilityIssue[];
    incomplete: AccessibilityIssue[];
    inapplicable: AccessibilityIssue[];
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
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    toast.error(`API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

// API functions
export async function runAccessibilityTest(options: AccessibilityTestOptions): Promise<AccessibilityTestResult> {
  const queryParams = options.enhanced ? '?enhanced=true' : '';
  return apiCall<AccessibilityTestResult>(`${API_BASE_URL}/test${queryParams}`, {
    method: 'POST',
    body: JSON.stringify({
      url: options.url,
      options: options.options || {},
    }),
  });
}

export async function runLighthouseTest(options: LighthouseTestOptions): Promise<LighthouseTestResult> {
  return apiCall<LighthouseTestResult>(`${API_BASE_URL}/test/lighthouse`, {
    method: 'POST',
    body: JSON.stringify({
      url: options.url,
    }),
  });
}

export async function getTestHistory(url: string): Promise<AccessibilityTestResult[]> {
  const encodedUrl = encodeURIComponent(url);
  return apiCall<AccessibilityTestResult[]>(`${API_BASE_URL}/test/history/${encodedUrl}`);
}

// Utility function to encode URLs for API calls
export function encodeUrl(url: string): string {
  return encodeURIComponent(url);
} 