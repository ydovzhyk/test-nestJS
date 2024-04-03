import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  job: string;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;

  @Prop({ required: false })
  avatar: string;
}

export const UserModel = SchemaFactory.createForClass(User);