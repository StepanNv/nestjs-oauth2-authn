import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import session from 'express-session';
import passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Регистрация функций которые passport будет использовать в нужный момент

  passport.serializeUser((user, done) => done(null, user)); // определяет, какие данные пользователя
  // нужно сохранить в сессии после успешной аутентификации, в данном случае весь объект user
  passport.deserializeUser((user: Express.User, done) => done(null, user)); // восстанавливает пользователя
  //  из данных сессии при последующих запросах и помещает их в объект запроса (req.user)

  // Подключение express-session

  app.use(
    session({
      secret: process.env.GOOGLE_SESSION_SECRET!, // ключ для подписи cookie сессии
      resave: false, // не сохранять сессию заново, если она не менялась
      saveUninitialized: false, // не создавать пустые сессии
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session()); // инициализирует работу passport с сессиями

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
