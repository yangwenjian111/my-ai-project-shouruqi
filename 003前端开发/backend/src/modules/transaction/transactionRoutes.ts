import { Router } from 'express';
import { authGuard } from '../../middleware/auth';
import { create, list, todayExpense, monthlyOverview, exportAll } from './transactionController';

const router = Router();

router.use(authGuard);

router.post('/', create);
router.get('/', list);
router.get('/today', todayExpense);
router.get('/monthly', monthlyOverview);
router.get('/export', exportAll);

export default router;
