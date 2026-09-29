import 'reflect-metadata';
import express from 'express';
import { corsMiddleware } from './middleware/cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/authRoutes';
import transactionRoutes from './modules/transaction/transactionRoutes';
import categoryRoutes from './modules/category/categoryRoutes';
import reserveRoutes from './modules/reserve/reserveRoutes';
import statisticsRoutes from './modules/statistics/statisticsRoutes';

const app = express();

// 全局中间件
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: { status: 'up', timestamp: new Date().toISOString() },
  });
});

// 业务路由
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reserve', reserveRoutes);
app.use('/api/statistics', statisticsRoutes);

// 404 与全局错误处理（必须放在所有路由之后）
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
