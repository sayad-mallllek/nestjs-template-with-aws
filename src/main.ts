import 'dotenv/config';

import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { ResponseInterceptor } from './interceptors/response.interceptor';

const GLOBAL_PREFIX = 'api';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    if (!!process.env.URL_VERSION)
        app
            .enableVersioning({
                type: VersioningType.URI,
                defaultVersion: process.env.URL_VERSION,
            })
            .setGlobalPrefix(GLOBAL_PREFIX);

    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
        }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.use(cookieParser());

    const config = new DocumentBuilder()
        .setBasePath(GLOBAL_PREFIX)
        // Rename it to your project name
        .setTitle('Backend API')
        .setDescription('The backend API routes')
        .setVersion('1.0')
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
    await app.listen(process.env.PORT || 3000);
}
bootstrap();
