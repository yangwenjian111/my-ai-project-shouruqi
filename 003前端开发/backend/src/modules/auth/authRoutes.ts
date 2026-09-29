import { Router } from 'express';
import { register, login, profile, updateNickname } from './authController';
import { authGuard } from '../../middleware/auth';

const router = Router();

// 公开接口
router.post('/register', register);
router.post('/login', login);

// 需登录接口
router.get('/profile', authGuard, profile);
router.put('/nickname', authGuard, updateNickname);

export default router;
