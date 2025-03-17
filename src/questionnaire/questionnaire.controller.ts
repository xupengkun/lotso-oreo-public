import { Body, Controller, Get, Headers, HttpException, HttpStatus, Query, Post, UnauthorizedException } from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';
import { UserService } from '../user/user.service';
import { PushDataRequestParamsType, SubscribeRequestParamsType } from './questionnaire.type';

@Controller('questionnaire')
export class QuestionnaireController {
  constructor(
    private readonly userService: UserService,
    private readonly service: QuestionnaireService
  ) {}

  @Get('queryRecord')
  async queryRecord(@Headers() headers: Record <string, string>, @Query('version') version: number) {
    const { authorization, device } = headers;

    if (!authorization) {
      throw new UnauthorizedException();
    }


    const userInfo = await this.userService.decodeJWTFromUserToken(authorization);

    return await this.service.queryRecord(userInfo, version || 1, device || '1');
  }

  @Post('pushUserRecord') 
  async pushUserRecord(@Headers() headers: Record <string, string>, @Body() bodyParams: PushDataRequestParamsType) {
    const { authorization, oreotoken, device } = headers;

    const {answer, doneFlag, version} = bodyParams;

    if (!authorization) {
      throw new UnauthorizedException();
    }
    if (!answer || !doneFlag || !version || !oreotoken) {
      throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
    }
    const userInfo = await this.userService.decodeJWTFromUserToken(authorization);
    const pushRecordRes = await this.service.pushUserRecord(userInfo, bodyParams, device || '1');
    try {
      if (version === 1 || version === 3) {
        // 第一个版本的问卷，在提交后第二天发放优惠券
        await this.service.updateUserCoupon(userInfo.userid, false, device || '1', oreotoken, version);
      } else {
        // 第二个版本的问卷，在提交后给用户发放优惠券
        await this.service.distributeCoupons(userInfo.userid, oreotoken, device || '1', version);
      }
    } catch (e) {
      console.log('领取优惠券出错: ', e)
    }
    
    return pushRecordRes;
  }

  @Post('subscribe')
  async subscribe(@Headers() headers: Record <string, string>, @Body() bodyParams: SubscribeRequestParamsType) {
    const { authorization, oreotoken } = headers;

    const { scene } = bodyParams;

    if (!authorization) {
      throw new UnauthorizedException();
    }
    if (!scene || !oreotoken) {
      throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
    }
    return this.service.subscribe(oreotoken, scene);
  }
  
  @Get('consumptionCoupon')
  async consumptionCoupon() {
    return await this.service.consumptionCoupon();
  }
}
