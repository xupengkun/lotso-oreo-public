import { Controller, Get, Headers, HttpException, HttpStatus, Query } from '@nestjs/common';
import { HostService } from './host.service';

@Controller('host')
export class HostController {
  constructor(
    private readonly service: HostService
  ) {}

  @Get('connect')
  async connect(@Headers() headers: Record <string, string>) {
    const { device } = headers;

    if (!device) {
      throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
    }
    return this.service.connectHost(device);
  };

  @Get('heartbeat')
  async heartbeat(@Headers() headers: Record <string, string>) {
    const { device } = headers;

    if (!device) {
      throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
    }

    return this.service.connectionHeartBeat(device);
  };

  @Get('_register')
  async register(@Headers() headers: Record <string, string>, @Query('name') name: string) {
    const { device } = headers;

    if (!device || !name) {
      throw new HttpException('BAD_REQUEST', HttpStatus.BAD_REQUEST);
    }

    return this.service.register(device, name);
  }
}
