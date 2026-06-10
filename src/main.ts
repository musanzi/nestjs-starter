import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import passport from 'passport';
import { Logger } from 'nestjs-pino';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(Logger));
  app.enableCors({
    credentials: true,
    origin: ['http://localhost:4200', 'http://localhost:4000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true
    })
  );
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      saveUninitialized: false,
      resave: false,
      rolling: true,
      cookie: {
        maxAge: +process.env.SESSION_MAX_AGE,
        httpOnly: true,
        sameSite: 'lax'
      }
    })
  );
  app.use(passport.initialize({}));
  app.use(passport.session());
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
