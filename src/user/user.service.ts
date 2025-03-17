import { CACHE_MANAGER, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CollectionName, UserDocument, UserInfoDto, UserJWTParamsType, createUserInfoFactory } from './user.db';
import { JWT_SECRET, MONGO_CONFIG_LABA_DB_NAME, WX_AppID, WX_AppSecret } from '../config';
import { Cache } from 'cache-manager';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map } from 'rxjs';
import * as JWT from 'jsonwebtoken';


export interface LoginWeChatResponse {
  openid: string;
  session_key: string;
}
export interface LoginWeChatServiceResponse {
  token: string,
  name: string,
  phone: string,
  userid: string,
}

@Injectable()
export class UserService {

  constructor(
    @InjectModel(CollectionName, MONGO_CONFIG_LABA_DB_NAME)
    private readonly userCollectionModel: Model<UserDocument>,

    @Inject(CACHE_MANAGER)
    private cacheService: Cache,

    private readonly httpService: HttpService
  ) {}
  
  async verifyToken(token: string): Promise<LoginWeChatServiceResponse> {
    try {
      const userJWTInfo = await this.decodeJWTFromUserToken(token);
      const newToken = await this.getJWT(userJWTInfo);
      return {
        name: userJWTInfo.name,
        phone: userJWTInfo.phone,
        userid: userJWTInfo.userid,
        token: newToken
      }
    } catch(e) {
      console.error(e);
      throw new UnauthorizedException();
    } 
  }

  // 从凯诘获取memberid完成登录
  async loginByKaiJie(memberid: string, device: string) {
    const openid = memberid; // openid 是用户唯一id

    const mongoSearchUserRes = await this.userCollectionModel.find<UserInfoDto>({ openid: openid, device }).exec();

    let userInfo: UserInfoDto;

    if (mongoSearchUserRes.length) {
      // 登录过
      userInfo = mongoSearchUserRes[0]
    } else {
      userInfo = createUserInfoFactory({
        openid: openid,
        device,
      });
      // 插入mongodb
      const mongoResult = await this.userCollectionModel.insertMany([userInfo]);
      userInfo._id = mongoResult[0]._id.toString();
    }

    const token = await this.getJWT({
      name: userInfo.name,
      phone: userInfo.phone,
      openid: userInfo.openid,
      userid: userInfo._id || ""
    });

    return {
      token,
      name: userInfo.name,
      phone: userInfo.phone,
      userid: userInfo._id || ""
    }
  }
  async loginToWeChat(code: string): Promise<LoginWeChatServiceResponse> {
    const resultRes = await this.httpService.get('https://api.weixin.qq.com/sns/jscode2session', { params: {
      appid: WX_AppID,
      secret: WX_AppSecret,
      js_code: code,
      grant_type: 'authorization_code'
    } }).pipe(map(response => response.data))
    // 微信登录最终结果
    const result = await lastValueFrom<LoginWeChatResponse>(resultRes);
    
    console.log('wechat login: ', result)
    const openid = result.openid; // openid 是用户唯一id

    const mongoSearchUserRes = await this.userCollectionModel.find<UserInfoDto>({ openid: openid }).exec();


    let userInfo: UserInfoDto;

    if (mongoSearchUserRes.length) {
      // 登录过
      userInfo = mongoSearchUserRes[0]
    } else {
      userInfo =  createUserInfoFactory({
        name: code,
        phone: code,
        id: result.openid,
        appid: result.openid,
        appsecret: result.session_key,
        openid: result.openid,
      });
      // 插入mongodb
      const mongoResult = await this.userCollectionModel.insertMany([userInfo]);
      userInfo._id = mongoResult[0]._id.toString();
    }

    const token = await this.getJWT({
      name: userInfo.name,
      phone: userInfo.phone,
      openid: userInfo.openid,
      userid: userInfo._id || ""
    });

    return {
      token,
      name: userInfo.name,
      phone: userInfo.phone,
      userid: userInfo._id || ""
    }
  }

  async getJWT(info: UserJWTParamsType, expiresIn = '36500d'): Promise<string> {
    return await new Promise((resolve, reject) => {
      JWT.sign(info, JWT_SECRET, {
        expiresIn
      }, (err, token) => {
        if (err) {
          reject(err);
        } else {
          resolve(token || "");
        }
      })
    })
  }

  async getUserFromUserid(userid: string): Promise<UserJWTParamsType> {
    const mongoResult = await this.userCollectionModel.find<UserInfoDto>({
      _id: userid,
    });
    if (mongoResult.length) {
      return {
        name: mongoResult[0].name,
        phone: mongoResult[0].phone,
        openid: mongoResult[0].openid,
        userid: userid
      }
    } else {
      throw new UnauthorizedException();
    }
  }

  async decodeJWTFromUserToken (token: string): Promise<UserJWTParamsType> {
    return await new Promise((resolve, reject) => {
      JWT.verify(token, JWT_SECRET, (err, decoded: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(this.decodeJWTUser(decoded));
        }
      })
    })
  }
  
  decodeJWTUser(decoded: UserJWTParamsType): UserJWTParamsType {
    return {
      name: decoded.name,
      phone: decoded.phone,
      openid: decoded.openid,
      userid: decoded.userid
    }
  }


  async cacheReset(): Promise<void> {
    return await this.cacheService.reset();
  }
  
  // async create(createUserDto: UserDocument): Promise<UserDocument> {
  //   const createMoule = new this.userCollectionModel(createUserDto);
  //   return createMoule.save();
  // }

  // async findUser(): Promise<UserDocument[]> {
  //   await this.cacheService.set('pengpeng', Date.now(), 60 * 60 * 60)
  //   return this.userCollectionModel.find().exec();
  // }
}
