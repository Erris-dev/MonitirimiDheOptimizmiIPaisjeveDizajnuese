import { Router } from 'express';
import { askAI } from '../controllers/ai.controllers';

const router = Router();

router.get('/ask', askAI);

export default router;