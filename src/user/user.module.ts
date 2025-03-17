import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CollectionName, UserSchma } from './user.db';
import { MONGO_CONFIG_LABA_DB_NAME } from '../config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: CollectionName, schema: UserSchma }], MONGO_CONFIG_LABA_DB_NAME),
    HttpModule
  ],
  providers: [UserService],
  controllers: [UserController]
})
export class UserModule {}
