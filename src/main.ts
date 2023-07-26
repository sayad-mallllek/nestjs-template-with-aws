import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1'
  });


  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.use(cookieParser());

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
