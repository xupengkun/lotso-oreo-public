
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';


export interface QuestionnaireSchemaType {
  userid: string,
  answer: string,
  version: number,
  doneFlag: 0|1,
  delete: 0|1,
  reciveCoupon: boolean,
  oreoToken: string,
  createtime: number; // 创建时间
  updatetime: number; // 更新时间
  deletetime?: number; // 删除时间
  device: string
}

@Schema()
export class QuestionnaireSchemaClass extends Document {

  @Prop()
  userid: string; // 用户id，user 表中的 _uid

  
  @Prop()
  answer: string;
  
  @Prop()
  device: string;

  @Prop()
  reciveCoupon: false
  
  @Prop()
  oreoToken: ""

  @Prop()
  version: number;

  @Prop()
  doneFlag: 0|1;

  @Prop()
  delete: 0|1;

  @Prop()
  createtime: number; // 创建时间

  @Prop()
  updatetime: number; // 更新时间

  @Prop()
  deletetime?: number; // 删除时间
}

export const createQuestionnaireSchemaFactory = (questionnaire: Partial<QuestionnaireSchemaType>) => {
  const defaultQuestionnaireInfo: QuestionnaireSchemaType = {
    userid: '',
    answer: '',
    version: 1,
    doneFlag: 0,
    delete: 0,
    device: '1',
    reciveCoupon: false,
    oreoToken: "",
    updatetime: Date.now(),
    createtime: Date.now(),
  }
  return { ...defaultQuestionnaireInfo, ...questionnaire }
}

export type QuestionnaireDocument = Document<QuestionnaireSchemaClass>;
export const CollectionName = 'questionnaire';
export const QuestionnaireSchma = SchemaFactory.createForClass(QuestionnaireSchemaClass);


