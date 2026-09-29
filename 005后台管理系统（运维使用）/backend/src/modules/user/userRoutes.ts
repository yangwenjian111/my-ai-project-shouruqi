import { Router } from 'express';
import { getUsers, getUserDetail, getUserTransactions, getUserReserveFunds } from './userController';
import { adminAuthGuard } from '../../middleware/auth';

const router = Router();
router.use(adminAuthGuard);

router.get('/', getUsers);
router.get('/:id', getUserDetail);
router.get('/:id/transactions', getUserTransactions);
router.get('/:id/reserve-funds', getUserReserveFunds);

export default router;
