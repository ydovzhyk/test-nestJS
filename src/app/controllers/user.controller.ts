import { Controller, Post, Body, HttpException, HttpStatus, Get, Param, Delete } from '@nestjs/common';
import { Types } from 'mongoose';
import { UserService } from '../services/user.service';
import { User } from '../../models/user.model';
import { RegisterUserDto } from '../dto/user.dto';
import { SendGridService } from '../services/sendgrid.service';

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateAvatarUrl() {
  const data = getRandomInt(2, 35);
  const subData = getRandomInt(3, 35);
  return `https://robohash.org/${Math.random().toString(data).substring(subData)}.png?size=100x100`;
}

@Controller('api')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly sendGridService: SendGridService,
  ) { }
    
    @Post('users')
    async createUser(@Body() registerUserDto: RegisterUserDto): Promise<User> {
      try {
        const { name, job } = registerUserDto;
        const existingUser = await this.userService.findUserByParam(name, job); 
        if (existingUser) {
            throw new HttpException('This user already exists', HttpStatus.CONFLICT);
        }
        
        const data = await this.userService.createUser(name, job);
        
        const email = 'ydovzhyk@gmail.com';
        const subject = 'New user';
        const text = 'A new user has been created!';
        const html = '<p>A new user has been created!</p>';
        await this.sendGridService.sendEmail(email, subject, text, html);
        
        return data;
    } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

  @Get('user/:userId')
  async getUserById(@Param('userId') userId: string): Promise<User> {
    try {
      const existingUser = await this.userService.findUserById(new Types.ObjectId(userId));
      if (!existingUser) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return existingUser.toJSON();
    } catch (error) {
      throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);
    }
  }
  
  @Get('user/:userId/avatar')
  async chackUserAvatar(@Param('userId') userId: string): Promise<string | User> {
    try {
      const existingUser = await this.userService.findUserByIdAvatar(new Types.ObjectId(userId));
      if (!existingUser) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (!existingUser.avatar || existingUser.avatar === '') {
        const avatarUrl = generateAvatarUrl();
        const existingAvatar = await this.userService.downloadAvatarAndSave(new Types.ObjectId(userId), avatarUrl);
        return existingAvatar;
      } else if (existingUser.avatar && (existingUser.avatar.startsWith('https://') || existingUser.avatar.startsWith('www.'))) {
        const existingAvatar = await this.userService.downloadAvatarAndSave(new Types.ObjectId(userId), existingUser.avatar);
        return existingAvatar;
      } else if (existingUser.avatar && existingUser.avatar.startsWith('data:image/png')) {
        return existingUser.avatar;
      } else {
        throw new HttpException('Failed to process avatar URL', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    } catch (error) {
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('user/:userId/avatar')
  async deleteUserAvatar(@Param('userId') userId: string): Promise<string | User> {
    try {
      const existingUser = await this.userService.findUserByIdAvatar(new Types.ObjectId(userId));
      if (!existingUser) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      if (existingUser.avatar) {
        await this.userService.deleteAvatarAndSave(new Types.ObjectId(userId));
        return 'Avatar deleted successfully';
      } else {
        return 'Avatar not found';
      }
    } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }
      throw new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}