import { Module } from '@nestjs/common';
import { HostService } from './host.service';
import { HostController } from './host.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CollectionName } from './host.db';
import { MONGO_CONFIG_LABA_DB_NAME } from '../config';
import { HostSchma } from './host.db';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CollectionName, schema: HostSchma }], MONGO_CONFIG_LABA_DB_NAME),
  ],
  controllers: [HostController],
  providers: [HostService]
})
export class HostModule {

}
