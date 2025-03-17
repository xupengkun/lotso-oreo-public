import { Module } from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';
import { QuestionnaireController } from './questionnaire.controller';
import { CollectionName as UserCollectionName, UserSchma } from '../user/user.db';
import { MONGO_CONFIG_LABA_DB_NAME } from 'src/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from '../user/user.service';
import { CollectionName, QuestionnaireSchma } from './questionnaire.db';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserCollectionName, schema: UserSchma }], MONGO_CONFIG_LABA_DB_NAME),
    MongooseModule.forFeature([{ name: CollectionName, schema: QuestionnaireSchma }], MONGO_CONFIG_LABA_DB_NAME),
    HttpModule
  ],
  controllers: [QuestionnaireController],
  providers: [QuestionnaireService, UserService],
})
export class QuestionnaireModule {}
