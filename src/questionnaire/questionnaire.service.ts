import { Injectable } from '@nestjs/common';
import { UserJWTParamsType } from '../user/user.db';
import { CollectionName, QuestionnaireDocument, QuestionnaireSchemaType, createQuestionnaireSchemaFactory } from './questionnaire.db';
import { MONGO_CONFIG_LABA_DB_NAME, OREO_APP_ID, OREO_COUPON_ID, OREO_TARGET, OREO_OPEN_TARGET, OREO_X_APP_KEY } from '../config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DistributeCouponsResType, PushDataRequestParamsType, PushUserRecordResponseType, QueryRecordResponseDataType } from './questionnaire.type';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map } from 'rxjs';
import { DefaultRequestReponseTypedef } from 'src/types';
import { Cron } from '@nestjs/schedule';
import * as dayjs from 'dayjs';

@Injectable()
export class QuestionnaireService {
  constructor(
    @InjectModel(CollectionName, MONGO_CONFIG_LABA_DB_NAME)
    private readonly questionnaireCollectionModel: Model<QuestionnaireDocument>,
    
    private readonly httpService: HttpService
  ) {}

  async queryRecord(userInfo: UserJWTParamsType, version: number, device: string): Promise<QueryRecordResponseDataType> {
    const userRecord = await this.questionnaireCollectionModel.find<QuestionnaireSchemaType & {_id: string}>({
      userid: userInfo.userid,
      version,
      device,
    });
    const responseData: QueryRecordResponseDataType = {
      userid: userInfo.userid,
      answer: '',
      doneFlag: false,
      version,
      device,
      id: ''
    };
    if (userRecord.length) {
      const recordItem = userRecord[0];
      responseData.answer = recordItem.answer;
      responseData.doneFlag = !!recordItem.doneFlag;
      responseData.version = recordItem.version;
      responseData.id = recordItem._id;
    }
    return responseData;
  }

  async pushUserRecord(userInfo: UserJWTParamsType, pushData: PushDataRequestParamsType, device: string): Promise<PushUserRecordResponseType> {
    const {answer, doneFlag, version} = pushData;
    const userRecord = await this.questionnaireCollectionModel.find<QuestionnaireSchemaType & {_id: string}>({
      userid: userInfo.userid,
      device,
      version
    });

    const pushDBData: Partial<QuestionnaireSchemaType> = {
      answer,
      doneFlag: doneFlag ? 1 : 0,
      version,
      userid: userInfo.userid,
      device
    };

    console.log(Date.now(), `::__PushAnswer__::::__Id(${userInfo.userid})__::__Device(${device})__::__Version(${version})`);

    if (userRecord.length) {
      await this.questionnaireCollectionModel.findOneAndUpdate({
        userid: userInfo.userid,
        device,
        version
      }, {
        $set: pushDBData
      });
    } else {
      const pushRes = await this.questionnaireCollectionModel.insertMany([createQuestionnaireSchemaFactory(pushDBData)]);
      return {
        success: true
      }
      try {
        const pushOreoRes = await this.httpService.post(OREO_OPEN_TARGET + "/rest/reward-log/create", {
          "winningId": pushRes[0]._id.toString(),
          "activityId": "TokaeGame",
          "activityName": "云朵蛋糕活动",
          "memberUnionId": userInfo.openid,
          "rewardId": pushDBData.version,
          "rewardName": "云朵蛋糕活动",
          "receiverInfo": JSON.stringify({
            answer: pushDBData.answer,
            version: pushDBData.version
          }),
          "rewardTime": dayjs().format("YYYY-MM-DD HH:mm:ss")
        }, {
          headers: {
            'X-App-Key': OREO_X_APP_KEY
          }
        });
        await lastValueFrom(pushOreoRes);
        console.log(Date.now(), `Push to Aoliao Successed::Id(${pushRes[0]._id.toString()})`);
      } catch (e) {
        console.error(Date.now(), `Push to Aoliao failed::`, e);
      }
    }
    return {
      success: true
    }
  }

  async distributeCoupons(userid: string, OreoToken: string, device: string, version: number): Promise<DistributeCouponsResType> {
    const resultRes = await this.httpService.post(OREO_TARGET + "/s-coupon/api/coupon/add", {
      appId: OREO_APP_ID,
      couponId: OREO_COUPON_ID,
    }, {
      headers: {
        Authorization: OreoToken 
      }
    }).pipe(map(response => response.data))

    const result = await lastValueFrom<DistributeCouponsResType>(resultRes);

    console.log('领取优惠券结果: ', result)

    if (result.code === 200) {
      this.updateUserCoupon(userid, true, device, "", version);
      return result;
    } else {
      throw result;
    }

  }

  @Cron("0 0 10 * * *")
  async consumptionCoupon(): Promise<any> {
    // 消费延期发放优惠券
    console.log('开始处理发放优惠券------', Date.now())
    const userRecord = await this.questionnaireCollectionModel.find<QuestionnaireSchemaType>({
      reciveCoupon: false
    });
    if (!userRecord.length) {
      console.log('数据库待发放优惠券数量为零')
      return userRecord;
    }
    const needHandleRecord = userRecord.slice(0, 10);
    return Promise.all(needHandleRecord.map(async (item: QuestionnaireSchemaType): Promise<DistributeCouponsResType> => {
      return await this.distributeCoupons(item.userid, item.oreoToken, item.device || '1', item.version).then(async (res) => {
        if (res.code === 200) {
          // 优惠券发放成功
          return res;
        } else {
          throw res;
        }
      })
    })).then((res) => {
      console.log('---------待处理发放优惠券人员全部处理完毕---------');
      if (userRecord.length > needHandleRecord.length) {
        return this.consumptionCoupon();
      }
      return res;
    }).catch((err) => {
      console.error(err);
      console.error('---------待处理发放优惠券人员全部处理有部分失败---------');
      setTimeout(() => {
        this.consumptionCoupon();
      }, 30000)
      throw err;
    })
  }

  async updateUserCoupon(userid: string, flag: boolean, device: string, token: string, version: number): Promise<boolean> {
    try {
      await this.questionnaireCollectionModel.findOneAndUpdate({
        userid: userid,
        device,
        version,
      }, {
        $set: {
          reciveCoupon: flag,
          oreoToken: token || ""
        }
      });
    } catch (e) {
      console.error("更新用户记录失败：", e);
    }
    return true;
  }

  async subscribe(OreoToken: string, scene: string[]): Promise<DefaultRequestReponseTypedef> {
    const resultRes = await this.httpService.post(OREO_TARGET + "/s-mall/api/subscribe/subscribe", {
      appId: OREO_APP_ID,
      couponId: OREO_COUPON_ID,
      scene: scene
    }, {
      headers: {
        Authorization: `Bearer ${OreoToken}` 
      }
    }).pipe(map(response => response.data))

    const result = await lastValueFrom<DistributeCouponsResType>(resultRes);

    console.log('订阅结果: ', result)

    return {
      code: 200,
      data: undefined,
      message: '订阅成功'
    };
  }
}
