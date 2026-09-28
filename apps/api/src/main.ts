import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.use(helmet());
  app.enableCors({ origin: config.get('WEB_ORIGIN', 'http://localhost:3000'), credentials: true });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  const document = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('USN Digital Club API').setDescription('Private club management API').setVersion('1.0').addBearerAuth().build());
  SwaggerModule.setup('api/docs', app, document);
  await app.listen(config.get<number>('PORT', 4000));
}
bootstrap().catch((error: unknown) => {
  console.error('API startup failed', error);
  process.exitCode = 1;
});
