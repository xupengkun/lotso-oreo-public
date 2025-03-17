import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { APP_ENV, APP_PORT } from './config';

const start = async () => {

  const app = await NestFactory.create(AppModule);
  return await app.listen(APP_PORT);

}

start().then(() => {
  console.log(`\nLotso start in http://${getIPAdress()}:${APP_PORT}\nEnv: ${APP_ENV}\n`);
});


function getIPAdress() {
  const interfaces = require('os').networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
        return alias.address;
      }
    }
  }
}
