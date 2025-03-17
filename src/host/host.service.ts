import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CollectionName, HostDocument, createHostFactory } from './host.db';
import { MONGO_CONFIG_LABA_DB_NAME, REDIS_KEY_PREFIX } from '../config';
import { Model } from 'mongoose';
import { ConnectHostResponseCodeEnum, ConnectHostResponseType, HostHeartBeatType, RegisterHostResponseType } from './host.type';
import { RedisCache } from '../types';

// 主机在线时间维持100秒，100秒之内更新主机状态可延续主机心跳
export const HostConnectionValidityPeriod = 100; 

@Injectable()
export class HostService {
  constructor(
    @InjectModel(CollectionName, MONGO_CONFIG_LABA_DB_NAME)
    private readonly hostCollectionModel: Model<HostDocument>,

    @Inject(CACHE_MANAGER)
    private cacheService: RedisCache,
  ) {}

  async connectHost(device: string): Promise<ConnectHostResponseType> {
    const deviceOnlineCacheKey = this.getOnLineDeviceKey(device);
    const deviceOnline = await this.cacheService.get<string>(deviceOnlineCacheKey);
    const responseData: ConnectHostResponseType = { code: ConnectHostResponseCodeEnum.SUCCESS };
    if (!deviceOnline) {
      const deviceInfo = await this.hostCollectionModel.find({
        name: device,
        delete: 0,
        enable: 1
      });
      if (!deviceInfo.length) {
        // 该机器没有注册，不能使用
        responseData.code = ConnectHostResponseCodeEnum.UN_REGISYER;
        return responseData;
      } else {
        await this.cacheService.set(deviceOnlineCacheKey, "-1", { ttl: HostConnectionValidityPeriod });
      }
    } else {
      responseData.code = ConnectHostResponseCodeEnum.ONLINED;
    }
    return responseData;
  }

  async connectionHeartBeat(device: string): Promise<HostHeartBeatType> {
    const deviceOnlineCacheKey = this.getOnLineDeviceKey(device);
    const deviceOnline = await this.cacheService.get<string>(deviceOnlineCacheKey);
    if (deviceOnline) {
      await this.cacheService.set(deviceOnlineCacheKey, deviceOnline, { ttl: HostConnectionValidityPeriod });
      // console.log('Device Heartbeat:', device, heartbeatResult)
      return { success: true }
    } else {
      await this.connectHost(device);
      return { success: true }
    }
  }

  async register(device: string, desc: string): Promise<RegisterHostResponseType> {
    await this.hostCollectionModel.insertMany([
      createHostFactory({
        name: device,
        desc: desc
      })
    ]) 
    return { success: true }
  }

  getOnLineDeviceKey(device: string): string {
    return `${REDIS_KEY_PREFIX}online_device_${device}`;
  }
}
