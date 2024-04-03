import { Module, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserController } from '../controllers/user.controller';
import { databaseConfig } from '../../../config/database.config';
import { UserService } from '../services/user.service'; 
import { SendGridService } from '../services/sendgrid.service';
import { User, UserModel } from '../../models/user.model';
import { CorsMiddleware } from '../../middleware/cors';

@Module({
  imports: [
    MongooseModule.forRoot(databaseConfig.uri),
    MongooseModule.forFeature([{ name: User.name, schema: UserModel }]),
    ConfigModule.forRoot(),
  ],
  controllers: [UserController],
  providers: [UserService, CorsMiddleware, SendGridService, ConfigService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorsMiddleware).forRoutes('*');
  }
}

