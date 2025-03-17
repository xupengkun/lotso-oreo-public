import { Controller, Post, Headers, HttpException, HttpStatus, Body, Get, Query } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { GameService } from './game.service';
import { HostService } from 'src/host/host.service';

@Controller('game')
export class GameController {
  constructor(
    private readonly userService: UserService,
    private readonly hostService: HostService,
    private readonly service: GameService
  ) {}

  /**
   * 注册，注册下一步是开始，注册成功后可触发任务，生成任务列表
   * */ 
  @Post('register')
  async registerGame(
    @Headers() headers: Record <string, string>,
  ) {

    const { authorization, device } = headers;

    if (!authorization || !device) {
      throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
    }

    const userInfo = await this.userService.decodeJWTFromUserToken(authorization);

    return this.service.registerStatus(userInfo, device);
  };

  @Get('getUserGameState')
  async getUserGameState(
    @Headers() headers: Record <string, string>,
  ) {

    const { authorization, device } = headers;

    if (!authorization || !device) {
      throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
    }

    const userInfo = await this.userService.decodeJWTFromUserToken(authorization);

    return this.service.getUserGameState(userInfo, device);
  }


  /**
   * 添加任务 任务由两端拉取执行
   * */ 
  @Post("pushTask")
  async pushTask(
    @Headers() headers: Record <string, string>,
    @Body() bodyParams: { type?: string }
  ) {
    const { authorization, device } = headers;

    if (!authorization || !device) {
      throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
    }

    const userInfo = await this.userService.decodeJWTFromUserToken(authorization);

    return this.service.pushTask(userInfo, device);
  }
  /**
   * 添加任务 任务由两端拉取执行
   * */ 
  @Post("pushTaskFromPc")
  async pushTaskFromPc(
    @Headers() headers: Record <string, string>,
    @Body() bodyParams: { userid: string }
  ) {
    const { device } = headers;
    const { userid } = bodyParams;

    if (!userid || !device) {
      throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
    }

    return this.service.pushTask(await this.userService.getUserFromUserid(userid), device);
  }

  // 游戏端调用，长调用
  @Get('poll')
  async poll(@Headers() headers: Record <string, string>) {
    const { device } = headers;
    
    if (!device) {
      throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
    }
    try {
      const returnParams = await this.service.poll(device);
      return {
        ...returnParams,
        hb: await this.hostService.connectionHeartBeat(device)
      };
    } catch(e) {
      console.error(e);
      return {};
    }
  }

  @Get('queryUserUseGameCount')
  async queryUserUseGameCount(@Headers() headers: Record <string, string>, @Query('userid') userid: string) {
    const { device } = headers;
    
    if (!device || !userid) {
      throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
    }
    return await this.service.queryUserUseGameCount(userid, device);
  }

  // 手机端端调用，长调用
  @Get('pollMobile')
  async pollMobile(@Headers() headers: Record <string, string>) {
    const { authorization, device } = headers;

    if (!authorization || !device) {
      throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
    }
    const userInfo = await this.userService.decodeJWTFromUserToken(authorization); 

    return this.service.pollMobile(userInfo, device);
  }

  @Get('doneConsumptionGameTask')
  async doneConsumptionGameTask(@Headers() headers: Record <string, string>) {
    const { device } = headers;
    
    if (!device) {
      throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
    }

    return this.service.doneConsumptionGameTask(device);
  }

  // // 游戏端调用，长调用
  // @Get('consumptionGameTask')
  // async consumptionGameTask(@Headers() headers: Record <string, string>) {
  //   const { device } = headers;
    
  //   if (!device) {
  //     throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
  //   }

  //   return this.service.consumptionGameTask(device);
  // }

  // @Get('queryUserGameState')
  // async queryUserGameState(@Headers() headers: Record <string, string>) {
  //   const { authorization, device } = headers;

  //   if (!authorization || !device) {
  //     throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
  //   }
  //   const userInfo = await this.userService.decodeJWTFromUserToken(authorization); 
  //   return this.service.queryUserGameState(userInfo, device);
  // }

  // @Get('queryInGameUser')
  // async queryInGameUser(
  //   @Headers() headers: Record <string, string>,
  // ) {
  //   const { device } = headers;

  //   if (!device) {
  //     throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
  //   }

  //   return this.service.queryInGameUser(device);
  // }

  @Get('test')
  async test() {
    return this.service.test()
  }

}
