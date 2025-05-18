import { Request, Response } from 'express';
import { AxeService } from '../services/axe.service';
import TestResult from '../models/test-result.model';

const axeService = new AxeService();

// Run an accessibility test on a URL
export const runTest = async (req: Request, res: Response) => {
  try {
    // Get URL and options from request body
    const { url, options } = req.body;
    
    // Validate URL
    if (!url || typeof url !== 'string' || !url.match(/^https?:\/\/.+/)) {
      return res.status(400).json({ error: 'Valid URL required' });
    }
    
    // Run the accessibility test
    const testResults = await axeService.testUrl(url, options || {});
    
    // Calculate score (simple approach - can be refined later)
    const passCount = testResults.passes.length;
    const violationCount = testResults.violations.length;
    const score = Math.round((passCount / (passCount + violationCount || 1)) * 100);
    
    // Create summary
    const summary = {
      violations: violationCount,
      passes: passCount,
      incomplete: testResults.incomplete.length,
      inapplicable: testResults.inapplicable.length,
      score
    };
    
    // Save to database
    const testResult = await TestResult.create({
      url: testResults.url,
      timestamp: testResults.timestamp,
      summary,
      results: {
        violations: testResults.violations,
        passes: testResults.passes,
        incomplete: testResults.incomplete,
        inapplicable: testResults.inapplicable
      },
      testEngine: testResults.testEngine
    });
    
    // Return response
    res.status(201).json({
      id: testResult._id,
      url: testResult.url,
      timestamp: testResult.timestamp,
      summary,
      results: {
        violations: testResults.violations,
        passes: testResults.passes,
        incomplete: testResults.incomplete
      }
    });
  } catch (error) {
    console.error('Error running accessibility test:', error);
    res.status(500).json({ error: 'Failed to run accessibility test' });
  }
};

// Get a specific test result by ID
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

// Get history of tests for a specific URL
export const getTestHistory = async (req: Request, res: Response) => {
  try {
    const { url } = req.params;
    
    // URL decode the parameter
    const decodedUrl = decodeURIComponent(url);
    
    const testResults = await TestResult
      .find({ url: decodedUrl })
      .sort({ timestamp: -1 })
      .limit(10);
    
    res.json(testResults);
  } catch (error) {
    console.error('Error retrieving test history:', error);
    res.status(500).json({ error: 'Failed to retrieve test history' });
  }
};
