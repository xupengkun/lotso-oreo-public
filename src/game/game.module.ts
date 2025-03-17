import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CollectionName as UserCollectionName, UserSchma } from '../user/user.db';
import { CollectionName as HostCollectionName, HostSchma } from '../host/host.db';
import { MONGO_CONFIG_LABA_DB_NAME } from 'src/config';
import { HttpModule } from '@nestjs/axios';
import { CollectionName as GameCollectionName, GameSchma } from './game.db';
import { UserService } from '../user/user.service';
import { HostService } from 'src/host/host.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserCollectionName, schema: UserSchma }], MONGO_CONFIG_LABA_DB_NAME),
    MongooseModule.forFeature([{ name: HostCollectionName, schema: HostSchma }], MONGO_CONFIG_LABA_DB_NAME),
    MongooseModule.forFeature([{ name: GameCollectionName, schema: GameSchma }], MONGO_CONFIG_LABA_DB_NAME),
    HttpModule
  ],
  controllers: [GameController],
  providers: [UserService, HostService, GameService]
})
export class GameModule {}
