
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


export interface GameSchemaType {
  prizesid: number,
  userid: string,
  taskid: string,
  hasprizes: boolean
  platformaddress: string; // 游戏地址
  createtime: number; // 创建时间
  updatetime: number; // 更新时间
  deletetime?: number; // 删除时间
}

@Schema()
export class GameSchemaClass extends Document {

  @Prop()
  prizesid: number;

  @Prop()
  userid: string; // 用户id，user 表中的 _uid

  @Prop()
  taskid: string; // 任务id

  @Prop()
  hasprizes: boolean; // 是否中奖

  @Prop()
  platformaddress: string; // 游戏地址

  @Prop()
  createtime: number; // 创建时间

  @Prop()
  updatetime: number; // 更新时间

  @Prop()
  deletetime?: number; // 删除时间
}

export const createGameSchemaFactory = (game: Partial<GameSchemaType>) => {
  const defaultGameInfo: GameSchemaType = {
    prizesid: 1,
    userid: '',
    taskid: '',
    hasprizes: false,
    platformaddress: '',
    updatetime: Date.now(),
    createtime: Date.now(),
  }
  return { ...defaultGameInfo, ...game }
}


export type GameDocument = Document<GameSchemaClass>;
export const CollectionName = 'game';
export const GameSchma = SchemaFactory.createForClass(GameSchemaClass);


