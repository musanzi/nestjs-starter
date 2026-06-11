import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import session from 'express-session';
import passport from 'passport';
import { Logger } from 'nestjs-pino';
import connectPgSimple from 'connect-pg-simple';
import { Pool } from 'pg';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const isProduction = process.env.NODE_ENV === 'production';
  const PgSessionStore = connectPgSimple(session);
  const sessionStore = new PgSessionStore({
    pool: new Pool({
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    }),
    tableName: 'session',
    createTableIfMissing: true
  });

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
      store: sessionStore,
      name: 'sid',
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
      resave: false,
      rolling: true,
      cookie: {
        maxAge: +process.env.SESSION_MAX_AGE,
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax'
      }
    })
  );
  app.use(passport.initialize({}));
  app.use(passport.session());
  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
