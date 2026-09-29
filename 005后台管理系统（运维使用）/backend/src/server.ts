import 'dotenv/config';
import 'reflect-metadata';
import { AppDataSource } from './config/dataSource';
import app from './app';

const PORT = Number(process.env.PORT) || 3001;

async function bootstrap(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log('[DB] 数据库连接成功');

    app.listen(PORT, () => {
      console.log(`[Server] 后台管理系统已启动: http://localhost:${PORT}`);
      console.log(`[Server] 健康检查:          http://localhost:${PORT}/api/admin/health`);
    });
  } catch (err) {
    console.error('[Server] 启动失败:', err);
    process.exit(1);
  }
}

bootstrap();
