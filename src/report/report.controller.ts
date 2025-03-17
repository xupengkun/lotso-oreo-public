import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportGameParams } from './report.type';

@Controller('report')
export class ReportController {

  constructor(
    private readonly service: ReportService
  ) {}

  @Post('game')
  async game(@Body() bodyParams: { startTime: number, endTime: number, otherParams?: ReportGameParams }) {
    if (!bodyParams.startTime || !bodyParams.endTime) {
      throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
    }
    return await this.service.game(bodyParams.startTime, bodyParams.endTime, bodyParams.otherParams);
  }

  @Post('form')
  async form(@Body() bodyParams: { startTime: number, endTime: number, otherParams?: ReportGameParams }) {
    if (!bodyParams.startTime || !bodyParams.endTime) {
      throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
    }
    return await this.service.form(bodyParams.startTime, bodyParams.endTime, bodyParams.otherParams);
  }

}
