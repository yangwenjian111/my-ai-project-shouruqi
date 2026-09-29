import { Router } from 'express';
import { getOverview } from './dashboardController';
import { adminAuthGuard } from '../../middleware/auth';

const router = Router();
router.use(adminAuthGuard);
router.get('/', getOverview);

export default router;
