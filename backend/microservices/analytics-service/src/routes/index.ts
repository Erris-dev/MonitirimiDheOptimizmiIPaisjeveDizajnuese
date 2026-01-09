import { Router } from 'express';
import aiRoutes from './ai.routes';
import insightRoutes from './insight.routes';

const router = Router();

router.use('/ai', aiRoutes);  
router.use('/insights', insightRoutes);

export default router;