import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../models/user.model';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async createUser(name: string, job: string): Promise<User> {
    const newUser = new this.userModel({ name, job });
    const savedUser = await newUser.save();
    const responseData = await this.userModel.findOne({ _id: savedUser._id });
    return responseData;
  }

  async findUserByParam(name: string, job: string): Promise<User> {
    return this.userModel.findOne({ name, job }).exec();
  }

  async findUserById(userId: Types.ObjectId): Promise<User> {
    const responseData = await this.userModel.findById(userId).select('_id name job createdAt').lean().exec();
    return new this.userModel(responseData);
  }

  async findUserByIdAvatar(userId: Types.ObjectId): Promise<User> {
    const responseData = await this.userModel.findById(userId).select('_id name job createdAt avatar').lean().exec();
    return new this.userModel(responseData);
  }

  async downloadAvatarAndSave(userId: Types.ObjectId, avatarUrl: string): Promise<any> {
    try {
      const response = await axios.get(avatarUrl, {
        responseType: 'arraybuffer',
      });
      
      const fileName = `avatar_${uuidv4()}.png`;
      const directory = '/tmp';
      // const directory = path.join(process.cwd(), 'uploads');
      const filePath = path.join(directory, fileName);

      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
        fs.chmodSync(directory, 0o755);
      }
      
      fs.writeFileSync(filePath, response.data);

      const base64Image = `data:image/png;base64,${Buffer.from(response.data, 'binary').toString('base64')}`;
  
      const avatarData = {
          userId: userId.toString(),
          filePath: filePath,
        };

      const jsonFilePath = path.join(directory, 'avatar_data.json');

      let existingData = [];
      if (fs.existsSync(jsonFilePath)) {
        const existingJsonData = fs.readFileSync(jsonFilePath, 'utf-8');
          existingData = JSON.parse(existingJsonData);
      }
      existingData.push(avatarData);
        
      fs.writeFileSync(jsonFilePath, JSON.stringify(existingData));

      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        { avatar: base64Image },
        { new: true },
      );
      
      return updatedUser.avatar;
    } catch (error) {
        throw error;
    }
}

  async deleteAvatarAndSave(userId: Types.ObjectId): Promise<any> {
    try {
      // const avatarDataPath = path.join(process.cwd(), 'uploads', 'avatar_data.json');
      const avatarDataPath = '/tmp/avatar_data.json';
      const avatarData = JSON.parse(fs.readFileSync(avatarDataPath, 'utf-8'));

      const existingAvatarData = avatarData.find((data: any) => {
        return data.userId === userId.toString();
      });
      
      if (!existingAvatarData) {
        throw new Error('Avatar data not found');
      }
      
      const avatarFilePath = existingAvatarData.filePath;
      fs.unlinkSync(avatarFilePath);

      const updatedAvatarData = avatarData.filter((data: any) => data.userId !== userId.toString());
        fs.writeFileSync(avatarDataPath, JSON.stringify(updatedAvatarData, null, 2));

      await this.userModel.findByIdAndUpdate(userId, { avatar: "" });

    } catch (error) {
        throw error;
    }
  }
}