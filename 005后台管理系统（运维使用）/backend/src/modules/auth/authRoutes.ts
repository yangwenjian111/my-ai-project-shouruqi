import { Router } from 'express';
import { login, profile } from './authController';
import { adminAuthGuard } from '../../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/profile', adminAuthGuard, profile);

export default router;
