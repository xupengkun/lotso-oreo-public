import { CacheModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MONGO_CONFIG_LABA_DB_NAME, MONGO_CONFIG_LABA_URL, REDIS_CONFIG } from './config';
import { UserModule } from './user/user.module';
import { redisStore } from 'cache-manager-redis-store';

import type { RedisClientOptions } from 'redis';
import { GameModule } from './game/game.module';
import { HostModule } from './host/host.module';
import { QuestionnaireModule } from './questionnaire/questionnaire.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(MONGO_CONFIG_LABA_URL, {
      connectionName: MONGO_CONFIG_LABA_DB_NAME
    }),
    CacheModule.register<RedisClientOptions>({
      isGlobal: true,
      // @ts-ignore
      store: redisStore,
      socket: {
        host: REDIS_CONFIG.host,
        port: REDIS_CONFIG.port,
      },
      password: REDIS_CONFIG.password,
      database: 0
    }),
    UserModule,
    GameModule,
    HostModule,
    QuestionnaireModule,
    ReportModule,
  ],
})
export class AppModule {}
