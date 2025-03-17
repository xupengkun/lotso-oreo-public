import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface HostInfoDto {
  name: string;
  mac_address: string;
  ip_address: string;
  desc: string;
  delete: 0|1;
  enable: 0|1;
  updateTime: number;
  createTime: number;
  deleteTime?: number;
}
@Schema()
export class Host extends Document implements HostInfoDto {
  @Prop()
  name: string;

  @Prop()
  mac_address: string;

  @Prop()
  ip_address: string;

  @Prop()
  desc: string;

  @Prop()
  delete: 0|1;

  @Prop()
  enable: 0|1;

  @Prop()
  updateTime: number;

  @Prop()
  createTime: number;

  @Prop()
  deleteTime?: number;
}


export type HostDocument = Document<Host>;
export const HostSchma = SchemaFactory.createForClass(Host);
export const CollectionName = "hosts";


export const createHostFactory = (userInfo: Partial<HostInfoDto>) => {
  const defaultUserInfo: HostInfoDto = {
    name: '',
    mac_address: '',
    ip_address: '',
    desc: '',
    delete: 0,
    enable: 1,
    updateTime: Date.now(),
    createTime: Date.now(),
  }
  return { ...defaultUserInfo, ...userInfo }
}