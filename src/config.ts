export const APP_ENV: string = 'TEST';

export const APP_PORT = APP_ENV === 'PROD' ? 3051 : 3050;

// laba 数据库 mongodb 的配置
export const MONGO_CONFIG_LABA = {
  host: '127.0.0.1',
  port: '20233',
  // db: 'laba_test', // 数据库名
  // user: 'laba_test', // 测试环境mongodb
  // pwd: '123456',
  db: APP_ENV === 'laba_test', // 数据库名
  user: APP_ENV === 'laba_test', // 正式环境mongodb
  pwd: APP_ENV === '123456',
}
export const MONGO_CONFIG_LABA_URL = `mongodb://${MONGO_CONFIG_LABA.user
  }:${MONGO_CONFIG_LABA.pwd
  }@${MONGO_CONFIG_LABA.host
  }:${MONGO_CONFIG_LABA.port
  }/${MONGO_CONFIG_LABA.db
  }?authSource=admin`;
export const MONGO_CONFIG_LABA_DB_NAME = MONGO_CONFIG_LABA.db; // 数据库名称


// redis
export const REDIS_CONFIG = {
  host: '',
  port: 20234,
  password: 'Aa123456',
  db: 1
}
export type RedisConfigType = typeof REDIS_CONFIG;

// 微信  -  目前不会用
export const WX_AppID = '';
export const WX_AppSecret = '';

// redis
export const REDIS_KEY_PREFIX = APP_ENV === 'PROD' ? '_PROD_' : '_TEST_';

// JWT
export const JWT_SECRET = 'LABA_JWT_SECRET';

export const OREO_TARGET = '';
export const OREO_OPEN_TARGET = '';
export const OREO_X_APP_KEY = '';

// 开发： 
// 生产： 
export const OREO_COUPON_ID = '';

// 开发： 
// 生产： 
export const OREO_APP_ID = '';
