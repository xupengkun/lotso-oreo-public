import { UserJWTParamsType } from "../user/user.db";

export enum RegisterStatusResponseDataTypeCodeEnum {
  SUCCESS,
  ALERADY,
  OTHERINGAME,
  MAX_PLAYED,
  HAS_PRIZED,
  HOST_OFFLINE,
}
export enum RegisterStatusResponseDataTypeMessageEnum {
  SUCCESS = "注册成功，可以开始",
  ALERADY = "准备成功，可以开始",
  OTHERINGAME = "其他人正在游戏",
  MAX_PLAYED = "游玩次数已达上限",
  HAS_PRIZED = "已经中奖", 
  HOST_OFFLINE = "主机离线，无法开始",
}
export interface RegisterStatusResponseDataType {
  code: RegisterStatusResponseDataTypeCodeEnum,
  message: RegisterStatusResponseDataTypeMessageEnum
}

export enum PushTaskResponseDataCodeEnum {
  OTHER_INGAME = -1,
  SUCCESS = 0,
  RUNNING = 1,
  STOPED = 2,
  HOST_OFFLINE,
}
export enum PushTaskResponseDataMessageEnum {
  OTHER_INGAME = "其他人正在玩",
  SUCCESS = "添加成功，马上开始",
  RUNNING = "游戏正在运行",
  STOPED = "因为其他原因，已停止运行",
  HOST_OFFLINE = "主机离线，无法开始",
}
// 推送时间
export interface PushTaskResponseDataType {
  code: PushTaskResponseDataCodeEnum,
  message: PushTaskResponseDataMessageEnum,
}

export enum TaskItemStatusEnum {
  NO_START,
  RUNNING,
  ENDED,
}
// 任务列表-in redis
export interface TaskItemType {
  userid: string,
  hasPrizes: boolean,
  taskId: string,
  status: TaskItemStatusEnum,
  prizesId: number,
  surplus: number,
}

export interface UserGameState {
  userid: string,
  hasPrizes: boolean,
  prizesId: number,
  surplus: number,
}

export enum QueryTaskStatusResponseCodeEnum {
  NOT_YOU = -2,
  NO_STATE = -1,
  RUNNING = 0,
  ENDED = 1,
}
export interface QueryTaskStatusResponseType {
  data?: TaskItemType,
  code: QueryTaskStatusResponseCodeEnum
}

// 游戏拉取返回数据
export type ConsumptionGameTaskResponseType = {
  userid: string,
  hasTask: boolean,
  task?: TaskItemType
};

export interface QueryInGameUserResponseType {
  hasUser: Boolean,
  user?: UserJWTParamsType
}

// 拉取游戏任务、登录用户等
export interface PcPollResponseType {
  user: QueryInGameUserResponseType,
  task: ConsumptionGameTaskResponseType
}

// 手机端调用，长调用
export interface MobilePollResponseType {
  game: QueryTaskStatusResponseType
}
