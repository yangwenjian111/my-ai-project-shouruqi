import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from './config/dataSource';
import app from './app';

const PORT = Number(process.env.PORT) || 3000;

async function bootstrap(): Promise<void> {
  try {
    // 初始化数据库连接
    await AppDataSource.initialize();
    console.log('[DB] 数据库连接成功');

    // 启动 HTTP 服务
    app.listen(PORT, () => {
      console.log(`[Server] 后端服务已启动: http://localhost:${PORT}`);
      console.log(`[Server] 健康检查:      http://localhost:${PORT}/api/health`);
    });
  } catch (err) {
    console.error('[Server] 启动失败:', err);
    process.exit(1);
  }
}

bootstrap();
