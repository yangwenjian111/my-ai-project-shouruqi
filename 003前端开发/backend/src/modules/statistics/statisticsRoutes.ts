import { Router } from 'express';
import { authGuard } from '../../middleware/auth';
import { trend, categoryPie, ranking } from './statisticsController';

const router = Router();

router.use(authGuard);

router.get('/trend', trend);
router.get('/category', categoryPie);
router.get('/ranking', ranking);

export default router;
