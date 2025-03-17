import { Body, Controller, Get, Headers, HttpException, HttpStatus, Post, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  
  constructor(
    private readonly service: UserService
  ) {}

  @Get("resetCache")
  async resetCache(): Promise<any> {
    return this.service.cacheReset();
  }

  @Get('getUserInfo')
  async verifyToken(@Headers() headers: Record < string, string >) {
    const token = headers['authorization'];
    if (token) {
      try {
        return await this.service.verifyToken(token);
      } catch (e) {
        throw new UnauthorizedException();
      }
    } else {
      throw new UnauthorizedException();
    }
  }

  @Post('loginByKaiJie')
  async loginByKaiJie(@Headers() headers: Record <string, string>, @Body('memberid') memberid: string) {
    const { device } = headers;
    if (!memberid) {
      throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
    }
    return await this.service.loginByKaiJie(memberid, device || '1');
  }

  @Post('loginToWeChat')
  async loginToWeChat(@Body('code') js_code: string) {
    if (!js_code) {
      throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
    }
    const result = await this.service.loginToWeChat(js_code);
    return result;
  }
}
