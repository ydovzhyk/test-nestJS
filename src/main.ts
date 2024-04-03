import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application listening on port ${port}`);
}
bootstrap();
