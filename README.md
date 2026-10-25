# NestJS OAuth2 Auth

Система аутентификации пользователей через Google и GitHub с использованием OAuth 2.0 и OpenID Connect. Позволяет войти через аккаунт стороннего сервиса и получить данные своего профиля после предоставления разрешения на доступ. Может быть использована как основа под более крупные системы аутентификации и авторизации пользователей.

Бэкенд написан на NestJS и TypeScript. Для входа через Google используется OpenID Connect, для GitHub — OAuth 2.0. После входа приложение создает сессию, по которой пользователь может получать свой профиль без повторной аутентификации.

## Что сделано в проекте

- **Вход через Google:** реализован сценарий OpenID Connect на базе библиотеки `openid-client`. При запуске сервер загружает конфигурацию провайдера через discovery, а при входе запрашивает права `openid email profile`. После обмена кода на токены библиотека проверяет ID токен, затем приложение получает идентификатор, почту и имя пользователя через UserInfo Endpoint.
- **Вход через GitHub:** реализован OAuth 2.0 Authorization Code Flow через `passport-oauth2`. Для защиты обмена используются `state` и PKCE. Полученный access токен используется для запроса к GitHub API (`/user`), а структура ответа проверяется перед сохранением профиля.
- **Сессии пользователя:** после успешного входа Passport сохраняет профиль в серверной сессии. В браузере хранится cookie `connect.sid` с флагами `HttpOnly` и `SameSite=Lax`. При последующих запросах пользователь восстанавливается из сессии. В режиме `production` дополнительно включается флаг `Secure`.
- **Получение своего профиля:** маршрут `/auth/me` возвращает данные пользователя из сессии. Если пользователь не вошел в приложение, сервер отвечает `401 Unauthorized`. Формат профиля зависит от сервиса, через который проходил вход.
- **Выход из приложения:** маршрут `/auth/logout` завершает сессию Passport, удаляет ее из хранилища и очищает cookie в браузере. При этом аккаунт пользователя в Google или GitHub остается авторизованным.

_На данный момент приложение получает только базовый профиль пользователя. Доступ к другим данным сервисов, например файлам Google Drive или репозиториям GitHub, пока не реализован. Токены провайдеров не возвращаются клиенту и не сохраняются для дальнейших запросов._

## Стек технологий

**Backend:**

- NestJS 12, TypeScript, Express
- Passport и `@nestjs/passport` — стратегии аутентификации и работа с пользователем
- `openid-client` 6 — OpenID Connect и получение профиля Google
- `passport-oauth2` — OAuth 2.0 для GitHub
- `express-session` — серверные сессии
- `@nestjs/config` — переменные окружения

**Инструменты:**

- pnpm — пакетный менеджер
- Oxlint — проверка кода
- Prettier — форматирование

## Структура проекта

```text
nestjs-oauth2-authn/
├── src/
│   ├── auth/
│   │   ├── strategies/
│   │   │   ├── google.strategy.ts   # Вход через Google и получение UserInfo
│   │   │   └── github.strategy.ts   # Вход через GitHub и запрос профиля через API
│   │   ├── auth.controller.ts       # Вход, callback, профиль и выход
│   │   └── auth.module.ts           # Регистрация стратегий и Google discovery
│   ├── app.module.ts               # Подключение конфигурации и модуля аутентификации
│   └── main.ts                     # Запуск сервера, настройка сессий и Passport
├── .env-example                    # Пример переменных окружения
└── package.json
```

## Быстрый запуск

### Требования

- Node.js 24
- pnpm (`npm install -g pnpm`)
- OAuth-приложения в Google и GitHub
- Доступ к интернету для загрузки конфигурации Google и запросов к провайдерам

---

### 1. Клонирование репозитория

```bash
git clone https://github.com/StepanNv/nestjs-oauth2-authn.git
cd nestjs-oauth2-authn
pnpm i
```

---

### 2. Настройка Google и GitHub

**Google:**

1. Создайте проект в Google Cloud и настройте экран согласия OAuth.
2. Создайте OAuth-клиент типа **Web application**.
3. В Authorized redirect URIs добавьте `http://localhost:3000/auth/google/callback`.
4. Сохраните Client ID и Client Secret — они понадобятся для `.env`.

Подробнее о настройке — в [документации Google](https://developers.google.com/identity/protocols/oauth2/web-server).

**GitHub:**

1. Откройте **Settings → Developer settings → OAuth Apps** и создайте новое OAuth-приложение.
2. В Homepage URL укажите `http://localhost:3000`.
3. В Authorization callback URL укажите `http://localhost:3000/auth/github/callback`.
4. Сохраните Client ID и создайте Client Secret для `.env`.

Подробнее о регистрации — в [документации GitHub](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app).

---

### 3. Настройка окружения

Создайте файл `.env` в корне проекта:

```bash
cp .env-example .env
```

_(в Windows PowerShell: `Copy-Item .env-example .env`)_

Заполните идентификаторы, секреты и callback-адреса обоих провайдеров. Для `GOOGLE_ISSUER` укажите `https://accounts.google.com`. Все переменные с примерами перечислены ниже в разделе «Переменные окружения».

Для `SESSION_SECRET`, который используется для подписи cookie общей сессии приложения, сгенерируйте случайную строку и вставьте в `.env` :

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

_Оба провайдера инициализируются при запуске, поэтому нужно заполнить настройки и Google, и GitHub. Файл `.env` исключен из Git через `.gitignore`._

---

### 4. Запуск сервера

```bash
pnpm run start:dev
```

Сервер запустится по адресу `http://localhost:3000`.

Для проверки откройте в браузере один из маршрутов:

- [Вход через Google](http://localhost:3000/auth/google/login)
- [Вход через GitHub](http://localhost:3000/auth/github/login)

После входа и выдачи разрешения приложение перенаправит на `/auth/me`, где отобразится JSON с профилем пользователя. Отдельного интерфейса в проекте нет. Корневой маршрут `/` не реализован и отвечает `404`.

---

## Swagger документация

После запуска сервера интерактивная документация API доступна по адресу [http://localhost:3000/docs](http://localhost:3000/docs). В ней описаны маршруты аутентификации, форматы профилей и возможные ответы сервера.

Спецификация OpenAPI в формате JSON: [http://localhost:3000/docs-json](http://localhost:3000/docs-json).

---

## Маршруты API

| Метод  | Маршрут                 | Описание                                              |
| ------ | ----------------------- | ----------------------------------------------------- |
| `GET`  | `/auth/google/login`    | Начало входа через Google                             |
| `GET`  | `/auth/google/callback` | Обработка ответа Google и создание сессии             |
| `GET`  | `/auth/github/login`    | Начало входа через GitHub                             |
| `GET`  | `/auth/github/callback` | Обработка ответа GitHub и создание сессии             |
| `GET`  | `/auth/me`              | Профиль пользователя из сессии или `401 Unauthorized` |
| `POST` | `/auth/logout`          | Завершение сессии и ответ `204 No Content`            |

Callback-маршруты вызываются при возвращении от провайдера после входа. Открывать их вручную не нужно.

**Пример профиля Google:**

```json
{
  "sub": "123456789012345678901",
  "email": "user@example.com",
  "name": "Example User"
}
```

**Пример профиля GitHub:**

```json
{
  "provider": "github",
  "providerId": "12345678",
  "login": "example-user",
  "name": "Example User"
}
```

У GitHub поле `name` может быть `null`, email не запрашивается. У Google поля `email` и `name` будут отсутствовать в JSON, если провайдер их не вернет.

Выйти можно через [страницу Swagger](http://localhost:3000/docs): откройте `POST /auth/logout`, нажмите **Try it out**, затем **Execute**.

Или выполните в консоли браузера на странице приложения:

```javascript
await fetch('/auth/logout', { method: 'POST', credentials: 'same-origin' });
```

---

## Переменные окружения

Настройки сервера задаются в файле `.env` в корне проекта:

| Переменная             | Описание                                                       | Пример                                       |
| ---------------------- | -------------------------------------------------------------- | -------------------------------------------- |
| `NODE_ENV`             | Режим работы; в `production` cookie передается только по HTTPS | `development`                                |
| `PORT`                 | Порт сервера, по умолчанию `3000`                              | `3000`                                       |
| `GOOGLE_ISSUER`        | Адрес Google OpenID Provider для discovery                     | `https://accounts.google.com`                |
| `GOOGLE_CLIENT_ID`     | Идентификатор OAuth-клиента Google                             | `your_google_client_id`                      |
| `GOOGLE_CLIENT_SECRET` | Секрет OAuth-клиента Google                                    | `your_google_client_secret`                  |
| `GOOGLE_REDIRECT_URI`  | Callback для входа через Google                                | `http://localhost:3000/auth/google/callback` |
| `GITHUB_CLIENT_ID`     | Идентификатор OAuth-приложения GitHub                          | `your_github_client_id`                      |
| `GITHUB_CLIENT_SECRET` | Секрет OAuth-приложения GitHub                                 | `your_github_client_secret`                  |
| `GITHUB_REDIRECT_URI`  | Callback для входа через GitHub                                | `http://localhost:3000/auth/github/callback` |
| `SESSION_SECRET`       | Секрет подписи cookie сессии для обоих провайдеров             | `bananchik123`                               |

Адреса callback в `.env` должны совпадать с адресами, указанными в настройках провайдеров. При изменении порта обновите их в обоих местах. Для входа и последующих запросов используйте один хост: `localhost` и `127.0.0.1` не используют общую cookie.

---

## Особенности текущей реализации

- Сессии хранятся в памяти процесса и теряются при перезапуске сервера. Для постоянного хранения и запуска нескольких экземпляров приложения понадобится внешнее хранилище сессий.
- Базы пользователей, объединения Google и GitHub в один аккаунт и системы ролей пока нет.
- Обновление и отзыв токенов провайдеров не реализованы. Выход завершает только локальную сессию приложения и не отзывает разрешение на доступ к профилю.
- В режиме `production` для cookie требуется HTTPS. Если TLS завершается на reverse proxy, потребуется настроить доверие к прокси.

---

## Автор

GitHub: [@StepanNv](https://github.com/StepanNv)
