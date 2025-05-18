import { Router } from 'express';
import * as testController from '../controllers/test.controller';

const router = Router();

router.post('/', (req, res, next) => {
  testController.runTest(req, res).catch(next);
});

router.get('/:id', (req, res, next) => {
  testController.getTestResult(req, res).catch(next);
});
router.get('/history/:url', (req, res, next) => {
  testController.getTestHistory(req, res).catch(next);
});

export default router;
