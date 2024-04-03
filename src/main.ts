import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/modules/app.module';
import { CorsMiddleware } from './middleware/cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(new CorsMiddleware().use);
  await app.listen(3000);
}
bootstrap();
