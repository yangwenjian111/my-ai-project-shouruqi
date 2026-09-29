import { Router } from 'express';
import { authGuard } from '../../middleware/auth';
import { list } from './categoryController';

const router = Router();

router.use(authGuard);

router.get('/', list);

export default router;
