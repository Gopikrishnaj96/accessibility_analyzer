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
      metrics: testResult.lighthouseMetrics
    });

  } catch (error) {
    console.error('Lighthouse error:', error);
    res.status(500).json({ 
      error: 'Lighthouse analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
