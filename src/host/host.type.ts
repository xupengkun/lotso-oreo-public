export enum ConnectHostResponseCodeEnum {
  UN_REGISYER,
  SUCCESS,
  ONLINED,
  ERROR,
}
export interface ConnectHostResponseType {
  code: ConnectHostResponseCodeEnum
}

export interface HostHeartBeatType {
  success: boolean
}

export interface RegisterHostResponseType {
  success: boolean
}