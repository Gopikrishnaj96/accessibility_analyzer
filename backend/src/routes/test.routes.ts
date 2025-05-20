import { Router } from 'express';
import * as testController from '../controllers/test.controller';

const router = Router();

// POST routes
router.post('/', (req, res, next) => {
  testController.runTest(req, res).catch(next);
});

router.post('/lighthouse', (req, res, next) => {
  testController.runLighthouseTest(req, res).catch(next);
});

// GET routes - specific routes first!
router.get('/history/:url', (req, res, next) => {
  testController.getTestHistory(req, res).catch(next);
});

router.get('/:id', (req, res, next) => {
  testController.getTestResult(req, res).catch(next);
});

export default router;
