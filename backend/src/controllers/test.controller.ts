import { Request, Response } from 'express';
import { AxeService, EnhancedAxeService } from '../services/axe';
import TestResult from '../models/test-result.model';
import { LighthouseService } from '../services/lighthouse.service';

export const runTest = async (req: Request, res: Response) => {
  try {
    const { url, options } = req.body;
    const useEnhanced = req.query.enhanced === 'true';

    if (!url || typeof url !== 'string' || !url.match(/^https?:\/\/.+/)) {
      return res.status(400).json({ error: 'Valid URL required' });
    }

    const service = useEnhanced ? new EnhancedAxeService() : new AxeService();
    const testResults = await service.testUrl(url, options || {});

    const passCount = testResults.passes.length;
    const violationCount = testResults.violations.length;
    const score = Math.round((passCount / (passCount + violationCount || 1)) * 100);

    const testResult = await TestResult.create({
      url: testResults.url,
      testType: 'axe',
      axeSummary: {
        violations: violationCount,
        passes: passCount,
        incomplete: testResults.incomplete.length,
        inapplicable: testResults.inapplicable.length,
        score
      },
      axeResults: {
        violations: testResults.violations,
        passes: testResults.passes,
        incomplete: testResults.incomplete,
        inapplicable: testResults.inapplicable
      },
      testEngine: testResults.testEngine
    });

    res.status(201).json({
      id: testResult._id,
      url: testResult.url,
      timestamp: testResult.timestamp,
      testType: 'axe',
      summary: testResult.axeSummary,
      results: testResult.axeResults
    });

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

    const query = decodedUrl ? { url: decodedUrl } : {};
    const testResults = await TestResult.find(query)
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    const history = testResults.map(tr => ({
      id: tr._id.toString(),
      url: tr.url,
      timestamp: tr.timestamp.toISOString(),
      testType: tr.testType,
      axeSummary: tr.axeSummary ? {
        score: tr.axeSummary.score / 100,
        violations: tr.axeSummary.violations
      } : undefined,
      lighthouseScores: tr.lighthouseScores ? {
        performance: tr.lighthouseScores.performance,
        accessibility: tr.lighthouseScores.accessibility,
        seo: tr.lighthouseScores.seo,
        bestPractices: tr.lighthouseScores.bestPractices
      } : undefined
    }));

    res.json(history);
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

export default {
  runTest,
  getTestResult,
  getTestHistory,
  runLighthouseTest,
  runFullAnalysis
};
