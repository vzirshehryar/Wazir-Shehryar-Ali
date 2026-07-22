import { Router } from 'express';
import { subscriptionController } from '../shared/container.js';

const router = Router();

router.post('/', subscriptionController.createBundle);
router.get('/user/:userId', subscriptionController.getUserBundles);
router.post('/:bundleId/cancel', subscriptionController.cancelBundle);
router.post('/process-renewals', subscriptionController.processRenewals);

export default router;