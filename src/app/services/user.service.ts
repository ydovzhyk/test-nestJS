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
        const filePath = path.join(directory, fileName);

        try {
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory, { recursive: true });
                fs.chmodSync(directory, 0o755);
            }
        } catch (mkdirError) {
          console.error('Error creating directory:', mkdirError);
          throw new Error('Error creating directory');
        }

        try {
            fs.writeFileSync(filePath, response.data);
        } catch (writeError) {
          console.error('Error writing file:', writeError);
          throw new Error('Error writing file');
        }

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

        try {
            fs.writeFileSync(jsonFilePath, JSON.stringify(existingData));
        } catch (writeJsonError) {
          console.error('Error writing JSON file:', writeJsonError);
          throw new Error('Error writing JSON file');
        }

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
        const avatarDataPath = '/tmp/avatar_data.json';
        const avatarData = JSON.parse(fs.readFileSync(avatarDataPath, 'utf-8'));

        const existingAvatarData = avatarData.find((data: any) => {
            return data.userId === userId.toString();
        });

        if (!existingAvatarData) {
            throw new Error('Avatar data not found');
        }

        const avatarFilePath = existingAvatarData.filePath;
        
        try {
            fs.unlinkSync(avatarFilePath);
        } catch (unlinkError) {
          console.error('Error deleting avatar file:', unlinkError);
          throw new Error('Error deleting avatar file');
        }

        const updatedAvatarData = avatarData.filter((data: any) => data.userId !== userId.toString());
        
        try {
            fs.writeFileSync(avatarDataPath, JSON.stringify(updatedAvatarData, null, 2));
        } catch (writeError) {
          console.error('Error writing avatar data to file:', writeError);
          throw new Error('Error writing avatar data to file');
        }

        await this.userModel.findByIdAndUpdate(userId, { avatar: "" });

    } catch (error) {
        throw error;
    }
  }
}