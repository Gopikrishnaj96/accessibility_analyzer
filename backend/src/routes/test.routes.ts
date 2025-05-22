import { Router, Request, Response } from 'express';
import * as testController from '../controllers/test.controller';
import TestResult from '../models/test-result.model';

const router = Router();

// POST routes
router.post('/', (req, res, next) => {
  testController.runTest(req, res).catch(next);
});

router.post('/lighthouse', (req, res, next) => {
  testController.runLighthouseTest(req, res).catch(next);
});

router.post('/analyze', (req, res, next) => {
  testController.runFullAnalysis(req, res).catch(next);
});

// GET routes
router.get('/history', async (req: Request, res: Response) => {
  try {
    const results = await TestResult.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .lean({ virtuals: true });

    const formattedResults = formatTestResults(results);
    res.json(formattedResults);
  } catch (error) {
    console.error('Error in getTestHistory:', error);
    res.json([]); 
  }
});

router.get('/history/:url', async (req: Request, res: Response) => {
  try {
    const { url } = req.params;
    const query = url ? { url: new RegExp(url, 'i') } : {};
    
    const results = await TestResult.find(query)
      .sort({ timestamp: -1 })
      .limit(10)
      .lean({ virtuals: true });

    const formattedResults = formatTestResults(results);
    res.json(formattedResults);
  } catch (error) {
    console.error('Error in getTestHistoryByUrl:', error);
    res.json([]);
  }
});

// Helper function to format test results
const formatTestResults = (results: any[]) => {
  return results.map(result => ({
    id: result._id.toString(),
    url: result.url,
    timestamp: result.timestamp.toISOString(),
    summary: {
      score: result.summary?.score / 100,
      violations: result.summary?.violations
    },
    lighthouseScores: {
      performance: result.lighthouseScores?.performance || 0,
      seo: result.lighthouseScores?.seo || 0,
      bestPractices: result.lighthouseScores?.bestPractices || 0
    }
  }));
};

export default router;
