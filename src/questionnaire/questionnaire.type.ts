import { DefaultRequestReponseTypedef } from "src/types"

export interface QueryRecordResponseDataType {
  userid: string,
  answer: string,
  doneFlag: boolean,
  version: number,
  id: string,
  device: string
}

export interface PushDataRequestParamsType {
  answer: string,
  doneFlag: boolean,
  version: number,
}

export interface PushUserRecordResponseType {
  success: boolean
}

export type DistributeCouponsResType = DefaultRequestReponseTypedef;

export interface SubscribeRequestParamsType {
  scene: string[]
}