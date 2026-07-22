import { Router } from 'express';
import { chatController } from '../shared/container.js';

const router = Router();

router.post('/', chatController.sendMessage);
router.get('/history/:userId', chatController.getHistory);

export default router;