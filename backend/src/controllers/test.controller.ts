import { Request, Response } from 'express';
import { AxeService, EnhancedAxeService } from '../services/axe';
import TestResult from '../models/test-result.model';
import { LighthouseService } from '../services/lighthouse.service';
import { isValidUrl } from '../utils/validation';
import { Document, Types } from 'mongoose';

// Define the interface for test results
interface FormattedTestResult {
  id: string;
  url: string;
  timestamp: string;
  testType: 'axe' | 'lighthouse' | 'combined';
  summary: {
    score: number;
    violations: number;
  } | null;
  lighthouseScores?: {
    performance: number;
    accessibility: number;
    seo: number;
    bestPractices: number;
  };
}

interface AxeResults {
  violations: any[];
  passes: any[];
  incomplete: any[];
  inapplicable: any[];
}

interface AxeSummary {
  score: number;
  violations: number;
  passes: number;
}

export interface AxeTestResult {
  _id: string;
  url: string;
  timestamp: Date;
  axeSummary: {
    score: number;
    violations: number;
    passes: number;
  };
  axeResults: {
    violations: Array<{
      id: string;
      impact: string;
      description: string;
      nodes: Array<{ html: string }>;
    }>;
    passes: any[];
    incomplete: any[];
    inapplicable: any[];
  };
}

export interface TestResultResponse {
  id: string;
  url: string;
  timestamp: string;
  testType: 'axe';
  summary: {
    score: number;
    violations: number;
    passes: number;
  };
  results: {
    violations: any[];
    passes: number;
    incomplete: number;
    inapplicable: number;
  };
}

export const runTest = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    const useEnhanced = req.query.enhanced === 'true';

    if (!url || typeof url !== 'string' || !url.match(/^https?:\/\/.+/)) {
      return res.status(400).json({ error: 'Valid URL required' });
    }

    const service = useEnhanced ? new EnhancedAxeService() : new AxeService();
    const testResults = await service.testUrl(url);

    const testResult = await TestResult.create({
      url: testResults.url,
      testType: 'axe',
      axeSummary: {
        violations: testResults.violations.length,
        passes: testResults.passes.length,
        incomplete: testResults.incomplete.length,
        inapplicable: testResults.inapplicable.length,
        score: Math.round((testResults.passes.length / (testResults.passes.length + testResults.violations.length || 1)) * 100)
      },
      axeResults: {
        violations: testResults.violations,
        passes: testResults.passes,
        incomplete: testResults.incomplete,
        inapplicable: testResults.inapplicable
      },
      testEngine: testResults.testEngine
    }) as ITestResult; // Type assertion here

    // Validate test result
    if (!testResult || !testResult.axeSummary || !testResult.axeResults) {
      throw new Error('Invalid test result data');
    }

    const response: TestResultResponse = {
      id: testResult._id.toString(),
      url: testResult.url,
      timestamp: testResult.timestamp.toISOString(),
      testType: 'axe',
      summary: {
        score: testResult.axeSummary.score,
        violations: testResult.axeSummary.violations,
        passes: testResult.axeSummary.passes
      },
      results: {
        violations: testResult.axeResults.violations,
        passes: testResult.axeResults.passes.length,
        incomplete: testResult.axeResults.incomplete.length,
        inapplicable: testResult.axeResults.inapplicable.length
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error running accessibility test:', error);
    res.status(500).json({ 
      error: 'Failed to run accessibility test',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getTestResult = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const testResult = await TestResult.findById(id);
    
    if (!testResult) {
      return res.status(404).json({ error: 'Test result not found' });
    }
    
    res.json(testResult);
  } catch (error) {
    console.error('Error retrieving test result:', error);
    res.status(500).json({ error: 'Failed to retrieve test result' });
  }
};

export const getTestHistory = async (req: Request, res: Response) => {
  try {
    const { url } = req.params;
    const decodedUrl = url ? decodeURIComponent(url) : null;

    if (decodedUrl && !isValidUrl(decodedUrl)) {
      return res.status(400).json({ 
        error: 'Invalid URL format' 
      });
    }

    const query = decodedUrl ? { url: decodedUrl } : {};
    const testResults = await TestResult.find(query)
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    const formattedResults = testResults.map(tr => ({
      id: tr._id.toString(),
      url: tr.url,
      timestamp: new Date(tr.timestamp).toISOString(),
      testType: tr.testType,
      // Fix score handling - don't divide by 100 again
      score: tr.testType === 'axe' 
        ? (tr.axeSummary?.score ?? 0) // Remove /100 since score is already in percent
        : (tr.lighthouseScores?.accessibility ?? 0),
      // Detailed axe results
      axe: tr.testType !== 'lighthouse' ? {
        violations: tr.axeSummary?.violations ?? 0,
        passes: tr.axeSummary?.passes ?? 0,
        issues: tr.axeResults?.violations?.map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description
        })) ?? []
      } : undefined,
      // Lighthouse data
      lighthouse: tr.testType !== 'axe' ? {
        performance: tr.lighthouseScores?.performance ?? 0,
        accessibility: tr.lighthouseScores?.accessibility ?? 0,
        opportunities: tr.lighthouseOpportunities?.map(o => ({
          id: o.id,
          title: o.title,
          score: o.score
        })) ?? []
      } : undefined
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Error retrieving test history:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve test history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

const lighthouseService = new LighthouseService();

export const runLighthouseTest = async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string' || !url.match(/^https?:\/\/.+/)) {
      return res.status(400).json({ error: 'Valid URL required' });
    }

    const results = await lighthouseService.runLighthouse(url);

    const testResult = await TestResult.create({
      url: results.url,
      testType: 'lighthouse',
      lighthouseScores: results.scores,
      lighthouseMetrics: {
        timing: results.timing,
        resources: results.resources
      },
      lighthouseOpportunities: results.opportunities,
      lighthouseDiagnostics: results.diagnostics,
      testEngine: {
        name: 'lighthouse',
        version: results.lighthouseVersion
      }
    });

    res.status(201).json({
      id: testResult._id,
      url: testResult.url,
      timestamp: testResult.timestamp,
      testType: 'lighthouse',
      scores: testResult.lighthouseScores,
      metrics: testResult.lighthouseMetrics,
      opportunities: testResult.lighthouseOpportunities,
      diagnostics: testResult.lighthouseDiagnostics
    });

  } catch (error) {
    console.error('Lighthouse error:', error);
    res.status(500).json({ 
      error: 'Lighthouse analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

interface AnalysisOptions {
  axe?: boolean;
  lighthouse?: boolean;
  enhanced?: boolean;
}

export const runFullAnalysis = async (req: Request, res: Response) => {
  try {
    const { url, options } = req.body;
    const { axe = true, lighthouse = true, enhanced = false }: AnalysisOptions = req.query;

    if (!url || typeof url !== 'string' || !url.match(/^https?:\/\/.+/)) {
      return res.status(400).json({ error: 'Valid URL required' });
    }

    // Run analyses in parallel
    const [axeResult, lighthouseResult] = await Promise.all([
      axe ? runAxeAnalysis(url, enhanced) : Promise.resolve(null),
      lighthouse ? lighthouseService.runLighthouse(url) : Promise.resolve(null)
    ]);

    // Save combined results
    const testResult = await TestResult.create({
      url,
      testType: 'combined',
      axeSummary: axeResult?.summary,
      axeResults: axeResult?.results,
      lighthouseScores: lighthouseResult?.scores,
      lighthouseMetrics: lighthouseResult?.timing,
      testEngine: {
        axeVersion: axeResult?.testEngine.version || 'N/A',
        lighthouseVersion: lighthouseResult?.lighthouseVersion || 'N/A'
      }
    });

    res.status(201).json({
      id: testResult._id,
      url: testResult.url,
      axe: axeResult,
      lighthouse: lighthouseResult,
      timestamp: testResult.timestamp
    });

  } catch (error) {
    console.error('Combined analysis error:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Helper function for axe analysis
const runAxeAnalysis = async (url: string, enhanced: boolean) => {
  const service = enhanced ? new EnhancedAxeService() : new AxeService();
  
  // Pass some default rules or don't specify rules at all
  const options = {
    // If you want specific rules, add them here:
    // rules: ['color-contrast', 'image-alt', 'heading-order']
  };
  
  const results = await service.testUrl(url, options);
  
  return {
    summary: {
      violations: results.violations.length,
      passes: results.passes.length,
      score: Math.round((results.passes.length / (results.passes.length + results.violations.length || 1)) * 100)
    },
    results: enhanced ? 
      results.violations.map(v => ({ ...v, wcagCriteria: (v as any).wcagCriteria })) 
      : results,
    testEngine: results.testEngine
  };
};

export const getAxeTests = async (req: Request, res: Response) => {
  try {
    const axeResults = await TestResult
      .find({ testType: 'axe' })
      .sort({ timestamp: -1 })
      .lean();

    const formattedResults = axeResults.map(result => ({
      id: result._id.toString(),
      url: result.url,
      timestamp: new Date(result.timestamp).toISOString(),
      summary: {
        score: (result.axeSummary?.score ?? 0) / 100,
        violations: result.axeSummary?.violations ?? 0,
        passes: result.axeSummary?.passes ?? 0
      },
      violations: result.axeResults?.violations?.map(v => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length
      })) ?? []
    }));

    res.json({
      total: formattedResults.length,
      results: formattedResults
    });
  } catch (error) {
    console.error('Error retrieving Axe test results:', error);
    res.status(500).json({
      error: 'Failed to retrieve Axe test results',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Mongoose document interface for test results
interface ITestResult extends Document {
  _id: Types.ObjectId;
  url: string;
  timestamp: Date;
  testType: 'axe';
  axeSummary: {
    score: number;
    violations: number;
    passes: number;
    incomplete: number;
    inapplicable: number;
  };
  axeResults: {
    violations: any[];
    passes: any[];
    incomplete: any[];
    inapplicable: any[];
  };
  testEngine: {
    name: string;
    version: string;
  };
}

export default {
  runTest,
  getTestResult,
  getTestHistory,
  runLighthouseTest,
  runFullAnalysis,
  getAxeTests
};
