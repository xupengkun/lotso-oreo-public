import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface UserInfoDto {
  _id?: string,
  name: string,
  phone: string,
  id: string,
  appid: string,
  appsecret: string,
  openid: string,
  delete: 0|1,
  enable: 0|1,
  isAdmin: 0|1,
  device: string,
  updateTime: number,
  createTime: number,
  deleteTime?: number,
}

export interface UserJWTParamsType {
  name: string,
  phone: string,
  openid: string,
  userid: string
}

@Schema()
export class User extends Document {
  // @Prop()
  // _id: string;

  @Prop()
  name: string;

  @Prop()
  phone: string;

  @Prop()
  id: string;

  @Prop()
  appid: string;

  @Prop()
  appsecret: string;

  @Prop()
  openid: string;

  @Prop()
  device: string;

  @Prop()
  delete: 0|1;

  @Prop()
  enable: 0|1;

  @Prop()
  isAdmin: 0|1;

  @Prop()
  updateTime: number;

  @Prop()
  createTime: number;

  @Prop()
  deleteTime?: number;
}

export const createUserInfoFactory = (userInfo: Partial<UserInfoDto>) => {
  const defaultUserInfo: UserInfoDto = {
    name: '',
    phone: '',
    id: '',
    appid: '',
    appsecret: '',
    openid: '',
    device: '1',
    delete: 0,
    enable: 1,
    isAdmin: 0,
    updateTime: Date.now(),
    createTime: Date.now(),
  }
  return { ...defaultUserInfo, ...userInfo }
}

export type UserDocument = Document<User>;
export const CollectionName = 'users';
export const UserSchma = SchemaFactory.createForClass(User);