import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MONGO_CONFIG_LABA_DB_NAME } from 'src/config';
import { CollectionName as QuestionnaireCollectionName, QuestionnaireSchma } from '../questionnaire/questionnaire.db';
import { CollectionName as GameCollectionName, GameSchma } from '../game/game.db';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: QuestionnaireCollectionName, schema: QuestionnaireSchma }], MONGO_CONFIG_LABA_DB_NAME),
    MongooseModule.forFeature([{ name: GameCollectionName, schema: GameSchma }], MONGO_CONFIG_LABA_DB_NAME),
  ],
  controllers: [ReportController],
  providers: [ReportService]
})
export class ReportModule {}
