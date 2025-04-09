import { Router } from 'express';
import {
  createApplication,
  getApplication,
  updateApplication,
  submitDisbursement,
  submitRepayment,
  getAllApplications,
  cancelApplication,
} from '../controllers/application.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Application routes
router.post('/', createApplication);
router.get('/', getAllApplications);
router.get('/:id', getApplication);
router.patch('/:id', updateApplication);
router.post('/:id/disbursement', submitDisbursement);
router.post('/:id/repayment', submitRepayment);
router.post('/:id/cancel', cancelApplication);

export default router; 