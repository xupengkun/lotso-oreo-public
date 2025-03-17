import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CollectionName, GameDocument, GameSchemaType, createGameSchemaFactory } from './game.db';
import { CollectionName as UserCollectionName, UserJWTParamsType } from '../user/user.db';
import { MONGO_CONFIG_LABA_DB_NAME, REDIS_KEY_PREFIX } from '../config';
import { Model } from 'mongoose';
import { UserDocument } from '../user/user.db';
import { HttpService } from '@nestjs/axios';
import { ConsumptionGameTaskResponseType, MobilePollResponseType, PcPollResponseType, PushTaskResponseDataCodeEnum, PushTaskResponseDataMessageEnum, PushTaskResponseDataType, QueryInGameUserResponseType, QueryTaskStatusResponseCodeEnum, QueryTaskStatusResponseType, RegisterStatusResponseDataType, RegisterStatusResponseDataTypeCodeEnum, RegisterStatusResponseDataTypeMessageEnum, TaskItemStatusEnum, TaskItemType, UserGameState } from "./game.type"
import { RedisCache } from '../types';
import { v4 as uuidV4 } from 'uuid';

const UserPlayCount = 2;

@Injectable() 
export class GameService { 
  constructor(
    @InjectModel(UserCollectionName, MONGO_CONFIG_LABA_DB_NAME)
    private readonly userCollectionModel: Model<UserDocument>,

    @InjectModel(CollectionName, MONGO_CONFIG_LABA_DB_NAME)
    private readonly gameCollectionModel: Model<GameDocument>,

    @Inject(CACHE_MANAGER)
    private cacheService: RedisCache,

    private readonly httpService: HttpService
  ) {}


  // 拉取游戏任务、登录用户等
  async poll(device: string): Promise<PcPollResponseType> {
    return {
      task: await this.consumptionGameTask(device),
      user: await this.queryInGameUser(device)
    }
  }

  // 手机端调用，长调用
  async pollMobile(userInfo: UserJWTParamsType, device: string): Promise<MobilePollResponseType> {
    return {
      game: await this.queryUserGameState(userInfo, device)
    };
  }

  

  // 注册游戏状态，只有注册过，才能生成唯一session，抢占式游戏
  async registerStatus(userInfo: UserJWTParamsType, device: string): Promise<RegisterStatusResponseDataType> {
    const responseData: RegisterStatusResponseDataType = {
      code: RegisterStatusResponseDataTypeCodeEnum.SUCCESS,
      message: RegisterStatusResponseDataTypeMessageEnum.SUCCESS
    };

    const onlineDevice = await this.getOnLineDevice(device);
    if (!onlineDevice) {
      // 主机不在线，无法开始游戏
      responseData.code = RegisterStatusResponseDataTypeCodeEnum.HOST_OFFLINE;
      responseData.message = RegisterStatusResponseDataTypeMessageEnum.HOST_OFFLINE;
      return responseData;
    }
    
    const cacheKey = this.getInGameUserCacheKeyKey(device);
    const inGameUser = await this.queryInGameUser(device);
    const inGameUserMap: UserJWTParamsType|undefined = inGameUser.hasUser ? inGameUser.user : undefined;


    const userPlayRecordList = await this.gameCollectionModel.find<GameSchemaType>({
      userid: userInfo.userid,
      platformaddress: device
    });
    const userPrizeRecord = userPlayRecordList.filter((item) => item.hasprizes);

    if (userPlayRecordList.length >= UserPlayCount) {
      // 用户已经玩了三次，达到游戏上限
      responseData.code = RegisterStatusResponseDataTypeCodeEnum.MAX_PLAYED,
      responseData.message = RegisterStatusResponseDataTypeMessageEnum.MAX_PLAYED
    } else if (userPrizeRecord.length) {
      // 用户已经中奖，不能玩了
      responseData.code = RegisterStatusResponseDataTypeCodeEnum.HAS_PRIZED,
      responseData.message = RegisterStatusResponseDataTypeMessageEnum.HAS_PRIZED
    } else {
      if (inGameUserMap) {
        if (userInfo.userid === inGameUserMap.userid) {
          responseData.code = RegisterStatusResponseDataTypeCodeEnum.ALERADY
          responseData.message = RegisterStatusResponseDataTypeMessageEnum.ALERADY
        } else {
          responseData.code = RegisterStatusResponseDataTypeCodeEnum.OTHERINGAME
          responseData.message = RegisterStatusResponseDataTypeMessageEnum.OTHERINGAME
        }
      } else {
        // 正常情况下，用户最多存在3分钟，排除极端情况，3分钟之内用户必须要结束
        await this.cacheService.set(cacheKey, JSON.stringify(userInfo), { ttl: 60 * 3 /* 3分钟 */ });
      }
    }
    return responseData;
  }

  // 获取用户游戏状态
  async getUserGameState(userInfo: UserJWTParamsType, device: string): Promise<UserGameState> {
    const userGameList = await this.gameCollectionModel.find<GameSchemaType>({
      userid: userInfo.userid,
      platformaddress: device,
    });

    const prizesItem = userGameList.find((item) => item.hasprizes);

    const responseData: UserGameState = {
      userid: userInfo.userid,
      hasPrizes: prizesItem !== undefined,
      prizesId: prizesItem ? prizesItem.prizesid : -1,
      surplus: UserPlayCount - userGameList.length,
    }

    return responseData
  }

  // 添加任务，可以开始
  async pushTask(userInfo: UserJWTParamsType, device: string): Promise<PushTaskResponseDataType> {

    const responseData: PushTaskResponseDataType = {
      code: PushTaskResponseDataCodeEnum.SUCCESS,
      message: PushTaskResponseDataMessageEnum.SUCCESS,
    }

    const onlineDevice = await this.getOnLineDevice(device);
    if (!onlineDevice) {
      // 主机不在线，无法开始游戏
      responseData.code = PushTaskResponseDataCodeEnum.HOST_OFFLINE;
      responseData.message = PushTaskResponseDataMessageEnum.HOST_OFFLINE;
      return responseData;
    }
    
    const inGameUser = await this.queryInGameUser(device);
    const cacheKey = this.getInGameUserCacheKeyKey(device);
    const inGameUserMap: UserJWTParamsType|undefined = inGameUser.hasUser ? inGameUser.user : undefined;

    if (inGameUserMap && inGameUserMap.userid !== userInfo.userid) {
      // 如果当前有人已经注册，则返回正忙
      responseData.code = PushTaskResponseDataCodeEnum.OTHER_INGAME;
      responseData.message = PushTaskResponseDataMessageEnum.OTHER_INGAME;
      return responseData;
    }
    
    const userPlayRecordList = await this.gameCollectionModel.find<GameSchemaType>({ userid: userInfo.userid, platformaddress: device });
    const userPrizeRecord = userPlayRecordList.filter((item) => item.hasprizes);
    if (userPlayRecordList.length >= UserPlayCount || userPrizeRecord.length) {
      // 用户已经中奖，不能玩了   或者次数已经用完
      responseData.code = PushTaskResponseDataCodeEnum.STOPED;
      responseData.message = PushTaskResponseDataMessageEnum.STOPED;
      try {
        await this.cacheService.del(cacheKey);
      } catch(e) {
        console.log(e, '删除键值出错');
      }
    } else {
      // 如果没有，处理开始
      if (!inGameUserMap) {
        await this.cacheService.set(cacheKey, JSON.stringify(userInfo), { ttl: 80 /* s */ });
      }
      const taskCacheKey = this.getTaskCacheKey(device);
      const taskItem = await this.cacheService.get<string>(taskCacheKey);
      const taskItemMap: TaskItemType = taskItem ? JSON.parse(taskItem) : undefined;
      if (taskItemMap) {
        if (taskItemMap.status === TaskItemStatusEnum.NO_START || taskItemMap.status === TaskItemStatusEnum.RUNNING) {
          responseData.code = PushTaskResponseDataCodeEnum.RUNNING;
          responseData.message = PushTaskResponseDataMessageEnum.RUNNING;
        } else {
          await this.createNewTask(taskCacheKey, userInfo, device);
        }
      } else {
        await this.createNewTask(taskCacheKey, userInfo, device);
      }
    }
    return responseData;
  }

  // 消费任务 - 完成
  async doneConsumptionGameTask(device: string): Promise<{ surplus: number }> {

    const taskCacheKey = this.getTaskCacheKey(device);
    const inListTask = await this.cacheService.get<string>(taskCacheKey);

    const taskItemMap: TaskItemType = inListTask ? JSON.parse(inListTask) : undefined;
    
    const responseData = { surplus: -1 };
    let deleteUserInfo = false;
    if (taskItemMap) {
      await this.cacheService.del(taskCacheKey)
      if (taskItemMap.hasPrizes) {
        // 中奖了
        deleteUserInfo = true;
        responseData.surplus = 0;
      } else {
        if (taskItemMap.userid) {
          const userUsedCount = await this.gameCollectionModel.find({
            userid: taskItemMap.userid,
            platformaddress: device,
          }).count();
          responseData.surplus = UserPlayCount - userUsedCount;
          
          if (responseData.surplus <= 0) {
            deleteUserInfo = true;
          }
        }
      }
    } else {
      console.log('无待消费的任务')
      deleteUserInfo = true;
    }
    if (deleteUserInfo) {
      await this.cacheService.del(this.getInGameUserCacheKeyKey(device));
    }
    return responseData;
  }

  
  // 消费任务
  async consumptionGameTask(device: string): Promise<ConsumptionGameTaskResponseType> {
    const taskCacheKey = this.getTaskCacheKey(device);
    const inGameUser = await this.queryInGameUser(device);
    const inGameUserMap: UserJWTParamsType|undefined = inGameUser.hasUser ? inGameUser.user : undefined;
    const inListTask = await this.cacheService.get<string>(taskCacheKey);
    const taskItemMap: TaskItemType = inListTask ? JSON.parse(inListTask) : undefined;
    const responseData: ConsumptionGameTaskResponseType = {
      userid: inGameUserMap ? inGameUserMap.userid : '',
      hasTask: false
    }
    if (taskItemMap && taskItemMap.status === TaskItemStatusEnum.NO_START) {
      // 更新redis的游戏状态为运行中
      const newTaskMap = {
        ...taskItemMap,
        status: TaskItemStatusEnum.RUNNING
      };
      await this.cacheService.set(taskCacheKey, JSON.stringify(newTaskMap), { ttl: (60 * 1) + 30 /* 1.5就要结束 */ })
      responseData.hasTask = true;
      responseData.task = newTaskMap;
    }
    return responseData;
  }

  async queryUserUseGameCount(userid: string, device: string) {
    const playedCount = await this.gameCollectionModel.find({
      userid,
      platformaddress: device,
    }).count();
    return {
      surplus: UserPlayCount - playedCount
    }
  }

  // 获取正在游戏的用户
  async queryInGameUser(device: string): Promise<QueryInGameUserResponseType> {
    const cacheKey = this.getInGameUserCacheKeyKey(device);
    const inGameUser = await this.cacheService.get<string>(cacheKey);
    const inGameUserMap: UserJWTParamsType = inGameUser ? JSON.parse(inGameUser) : undefined;
    if (inGameUserMap) {
      return {
        hasUser: true,
        user: inGameUserMap
      }
    } else {
      return {
        hasUser: false
      }
    }
  }

  // 获取用户的游戏状态
  async queryUserGameState(userInfo: UserJWTParamsType, device: string): Promise<QueryTaskStatusResponseType> {
    const inGameUser = await this.queryInGameUser(device);
    const inGameUserMap: UserJWTParamsType|undefined = inGameUser.hasUser ? inGameUser.user : undefined;
    
    const taskCacheKey = this.getTaskCacheKey(device);
    const inListTask = await this.cacheService.get<string>(taskCacheKey);
    const taskItemMap: TaskItemType = inListTask ? JSON.parse(inListTask) : undefined;

    const result: QueryTaskStatusResponseType = {
      code: QueryTaskStatusResponseCodeEnum.RUNNING,
    }
    if ((inGameUserMap && inGameUserMap.userid !== userInfo.userid) || !taskItemMap) {
      // 没有从缓存中获取数据,那么就从数据库中获取数据
      const userUsedData = await this.gameCollectionModel.find<GameSchemaType>({
        userid: userInfo.userid,
        platformaddress: device
      });
      const userPrizeRecord = userUsedData.filter((item) => item.hasprizes);
      result.data = {
        userid: userInfo.userid,
        hasPrizes: userPrizeRecord.length > 0,
        taskId: '',
        status: TaskItemStatusEnum.ENDED,
        prizesId: userPrizeRecord[0] ? userPrizeRecord[0].prizesid : 0,
        surplus: UserPlayCount - userUsedData.length,
      };
      result.code = QueryTaskStatusResponseCodeEnum.ENDED;
    } else if (taskItemMap) {
      if (taskItemMap.status === TaskItemStatusEnum.ENDED) {
        result.code = QueryTaskStatusResponseCodeEnum.ENDED;
        result.data = taskItemMap;
      }
    } else {
      result.code = QueryTaskStatusResponseCodeEnum.NO_STATE;
    }
    return result;
  }

  // 创建任务
  async createNewTask(taskCacheKey: string, userInfo: UserJWTParamsType, device: string): Promise<number> {
    await this.cacheService.del(taskCacheKey);
    let probability = 30;
    if (device === '2') {
      probability = 40;
    }
    const probabilityResult = this.getProbabilityResult(probability);
    const taskId = uuidV4();
    const prizesId = await this.addUserPlayRecord(userInfo, probabilityResult, taskId, device); // 添加数据库记录
    const record = await this.gameCollectionModel.find({ userid: userInfo.userid, platformaddress: device }).count();
    const metaTaskItemMap: TaskItemType = {
      userid: userInfo.userid,
      taskId: taskId,
      hasPrizes: probabilityResult,
      status: TaskItemStatusEnum.NO_START,
      prizesId: prizesId,
      surplus: UserPlayCount - record
    }
    await this.cacheService.set(taskCacheKey, JSON.stringify(metaTaskItemMap), { ttl: (60 * 1) + 30 /* 1.5就要结束 */ });
    
    console.log(Date.now(), `::__CreateGameTask__::::__Id(${
      userInfo.userid
    })__::__Device(${
      device
    })__::__Result(${
      metaTaskItemMap.hasPrizes
    })__::__PrizesId(${
      metaTaskItemMap.prizesId
    })`);

    return prizesId;
  }
  // 添加游戏记录到数据库
  async addUserPlayRecord(userInfo: UserJWTParamsType, probabilityResult: boolean, taskId: string, device: string): Promise<number> {
    let prizesId = -1;
    if (probabilityResult) {
      // 如果中奖了
      const dbPrizesCount = await this.gameCollectionModel.find({ hasprizes: true }).count();
      prizesId = dbPrizesCount + 1;
    }
    await this.gameCollectionModel.insertMany([createGameSchemaFactory({
      prizesid: prizesId,
      userid: userInfo.userid,
      hasprizes: probabilityResult,
      platformaddress: device,
      taskid: taskId,
    })]);
    return prizesId;
  }

  getProbabilityResult(probability: number = 30): boolean {
    const random = Math.floor(Math.random() * 100); // 0 - 99
    return random < probability;
  }

  getTaskCacheKey(device: string): string {
    return `${REDIS_KEY_PREFIX}ingame_task_${device}`
  }

  getInGameUserCacheKeyKey(device: string): string {
    return `${REDIS_KEY_PREFIX}ingame_user_${device}`
  }

  getTodayEndTtl() {
    const date = new Date();
    const date2 = new Date();
    date2.setHours(23);
    date2.setMinutes(59);
    date2.setSeconds(59);
    return Math.floor((date2.getTime() - date.getTime()) / 1000);
  }

  async getOnLineDevice(device: string): Promise<string|undefined> {
    const key = `${REDIS_KEY_PREFIX}online_device_${device}`;
    return await this.cacheService.get<string>(key);
  }

  async test(){
    const result = await this.userCollectionModel.find();
    return result;
  }
}
