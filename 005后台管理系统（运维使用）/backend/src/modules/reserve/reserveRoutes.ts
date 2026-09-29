import { Router } from 'express';
import { getReserveFunds, getMonthlySummary } from './reserveController';
import { adminAuthGuard } from '../../middleware/auth';

const router = Router();
router.use(adminAuthGuard);

router.get('/summary', getMonthlySummary);
router.get('/', getReserveFunds);

export default router;
