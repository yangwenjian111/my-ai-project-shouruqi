import { Router } from 'express';
import { authGuard } from '../../middleware/auth';
import { getCurrent, setReserve } from './reserveController';

const router = Router();

router.use(authGuard);

router.get('/current', getCurrent);
router.post('/', setReserve);

export default router;
