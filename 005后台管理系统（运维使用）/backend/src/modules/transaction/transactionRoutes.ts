import { Router } from 'express';
import { getTransactions, getTransactionDetail } from './transactionController';
import { adminAuthGuard } from '../../middleware/auth';

const router = Router();
router.use(adminAuthGuard);

router.get('/', getTransactions);
router.get('/:id', getTransactionDetail);

export default router;
