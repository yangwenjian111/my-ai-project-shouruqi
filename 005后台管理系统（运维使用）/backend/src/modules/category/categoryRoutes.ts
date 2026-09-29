import { Router } from 'express';
import { getCategories, createCategory, deleteCategory } from './categoryController';
import { adminAuthGuard } from '../../middleware/auth';

const router = Router();
router.use(adminAuthGuard);

router.get('/', getCategories);
router.post('/', createCategory);
router.delete('/:id', deleteCategory);

export default router;
