# Лабораторная работа №4: Завершение бэкенда для SPA (Аутентификация, Сессии в Redis, Cookies, Swagger, ТЗ)

## Тема проекта
**«Оптимизатор запросов баз данных (Indexes API)»** — REST API веб-сервис для каталогизации и выбора оптимальных индексов реляционных СУБД (B-Tree, Hash, BRIN, GIN), сессионной аутентификации в Redis с поддержкой HttpOnly Cookies, интерактивной документации Swagger (OpenAPI 3.0), объектного хранилища медиафайлов MinIO и разграничения прав доступа (Гость / Создатель).

---

## 1. Стек технологий
- **Бэкенд фреймворк:** NestJS 10 (TypeScript 5)
- **СУБД:** PostgreSQL 16 (TypeORM 0.3)
- **Сессионное хранилище:** Redis 7 (`ioredis`)
- **Объектное S3-хранилище медиа:** MinIO
- **Аутентификация:** Сессии (stateful), HttpOnly Cookies (`cookie-parser`, UUID v4)
- **Спецификация API:** Swagger UI / OpenAPI 3.0 (`@nestjs/swagger`)
- **Валидация данных:** `class-validator`, `class-transformer`
- **Контейнеризация:** Docker & Docker Compose

---

## 2. Архитектура проекта и структура папок

```text
database_query_optimizer/
├── src/
│   ├── auth/                             # Модуль аутентификации и авторизации
│   │   ├── guards/
│   │   │   ├── session.guard.ts          # Защита эндпоинтов создателя (проверка сессии в Redis)
│   │   │   └── optional-session.guard.ts # Опциональная сессия для гостей и авторов (вычисление isOwner)
│   │   ├── auth.controller.ts            # Маршруты /api/auth (login, logout, register, me)
│   │   ├── auth.service.ts               # Бизнес-логика входа, генерации сессий в Redis и валидации
│   │   └── auth.module.ts
│   ├── session/                          # Модуль работы с сессионным хранилищем Redis
│   │   ├── session.service.ts            # Redis клиент (ioredis): create (TTL 3600), getUserId, destroy
│   │   └── session.module.ts             # Глобальный модуль Redis
│   ├── indexes/                          # Домен «Индексы БД / Услуги»
│   │   ├── dto/
│   │   │   ├── create-draft.dto.ts       # Валидация и Swagger-схема создания черновика
│   │   │   ├── publish-index.dto.ts      # Валидация и Swagger-схема публикации
│   │   │   ├── index-filters.dto.ts      # Фильтры каталога (?search, ?indexType, ?minCardinality)
│   │   │   ├── like-index.dto.ts         # Валидация лайка (value: 0 | 1)
│   │   │   └── index-response.dto.ts     # DTO ответа услуги (isOwner: 0/1, isLiked: 0/1) и ленты
│   │   ├── entities/
│   │   │   ├── database-index.entity.ts  # Сущность «Индекс БД» в PostgreSQL
│   │   │   └── index-like.entity.ts      # Сущность лайка с отдельным первичным ключом
│   │   ├── indexes.controller.ts         # REST API маршруты (/api/indexes) с тегом Swagger Indexes
│   │   ├── indexes.service.ts            # Бизнес-логика, автозаполнение authorId из сессии
│   │   ├── minio.service.ts              # Прямые постоянные URL объектов в MinIO
│   │   └── indexes.module.ts
│   ├── users/                            # Домен пользователей
│   │   ├── entities/user.entity.ts       # Сущность пользователя (id, username, password, role)
│   │   └── ...
│   ├── app.module.ts                     # Главный модуль с подключением TypeORM, Redis и Config
│   └── main.ts                           # GlobalPrefix('api'), SwaggerModule, cookieParser, CORS
├── docker-compose.yml                    # Контейнеры Postgres, Adminer, MinIO, Redis
└── docs/                                 # Диаграммы StarUML (РИП.mdj), Sequence диаграмма, вопросы ЛР4
```

---

## 3. Требования ТЗ и их реализация в ЛР-4

1. **Сессионная аутентификация в Redis:**
   * Метод `POST /api/auth/login` проверяет логин/пароль в PostgreSQL, генерирует случайный идентификатор сессии `sessionId` (UUID v4) и сохраняет его в Redis по ключу `session:<uuid>` со значением `userId` и временем жизни `TTL = 3600 с` (1 час).
   * Клиенту выставляется кука `Set-Cookie: sessionId=...; HttpOnly; SameSite=Lax; Path=/`.
   * Флаг `HttpOnly` запрещает доступ к куке из JavaScript, исключая кражу сессии при XSS-атаках.
2. **Мгновенный Logout:**
   * Метод `POST /api/auth/logout` немедленно удаляет сессионный ключ из Redis (`DEL session:...`) и зачищает куку `sessionId`, предотвращая повторное использование скомпрометированных токенов.
3. **Разграничение прав доступа (Гость / Создатель):**
   * **Гость (без сессии/куки):** доступны только методы чтения `GET /api/indexes`, `GET /api/indexes/feed`, `GET /api/indexes/:id`. Во всех карточках выставляется `isOwner: 0` и `isLiked: 0`.
   * Попытка гостя вызвать методы модификации (`POST /api/indexes`, `PUT /api/indexes/:id/publish`, `DELETE`, `POST /like`) прерывается защитным гардом `SessionGuard` с кодом **`401 Unauthorized`**.
   * **Создатель (авторизованный пользователь):** может создавать черновики, публиковать и удалять свои услуги.
   * Попытка изменить или опубликовать чужую услугу прерывается с кодом **`403 Forbidden`**.
4. **Автозаполнение автора (`authorId`):**
   * При создании черновика (`POST /api/indexes`) поле автора не передаётся с фронтенда, а автоматически извлекается бэкендом из активной сессии Redis (`req.userId`) и сохраняется в БД.
5. **Интерактивная документация Swagger (OpenAPI 3.0):**
   * Документация доступна по адресу **`http://localhost:3000/api/docs`**.
   * Настроена авторизация по кнопке **Authorize** через Cookie `sessionId`.
   * Все эндпоинты сгруппированы по двум разделам: **`Authentication`** и **`Indexes`**.
   * Подробно задокументированы все схемы DTO, параметры запросов и коды ответов (`200 OK`, `201 Created`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`).
6. **Диаграмма последовательности (Sequence Diagram):**
   * Построена в StarUML (файл `РИП.mdj`) для всего бизнес-процесса без БД и нативного клиента.
   * Линии жизни: `Фронтенд (гость)`, `Фронтенд (создатель)`, `: Домен users`, `: Домен indexes`.
   * Свойства `signature` у каждого сообщения переиспользованы из операций классов диаграммы бэкенда (`POST Login`, `GET Indexes`, `POST Index`, `GET Draft`, `PUT Index`, `GET Feed`, `POST Like`).

---

## 4. Спецификация REST API маршрутов

| Метод | URL | Доступ | Входные данные | Описание |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Гость | `{ username, password, role? }` | Регистрация нового пользователя |
| `POST` | `/api/auth/login` | Гость | `{ username, password }` | Вход: создание сессии в Redis, возврат `Set-Cookie: sessionId` |
| `POST` | `/api/auth/logout` | Создатель | `Cookie: sessionId` | Выход: мгновенное удаление сессии из Redis |
| `GET` | `/api/auth/me` | Создатель | `Cookie: sessionId` | Получение профиля текущего авторизованного пользователя |
| `GET` | `/api/indexes` | Все | Query: `search`, `indexType`, `minCardinality` | Каталог опубликованных индексов с флагом `isOwner: 0/1` |
| `GET` | `/api/indexes/feed` | Все | Query: `id`, `next=true` | Циклическая лента видеороликов индексов |
| `GET` | `/api/indexes/draft` | Создатель | `Cookie: sessionId` | Получение черновика текущего пользователя |
| `GET` | `/api/indexes/:id` | Все | Param: `id` | Детальный просмотр опубликованного индекса |
| `POST` | `/api/indexes` | Создатель | `multipart/form-data`: поля + файлы | Создание черновика, `authorId` извлекается из сессии |
| `PUT` | `/api/indexes/:id/publish` | Создатель (автор) | Param: `id`, Body: `publishDto` | Публикация черновика (`draft -> published`) |
| `DELETE`| `/api/indexes/:id` | Создатель (автор) | Param: `id`, `Cookie: sessionId` | Мягкое логическое удаление индекса (`status = deleted`) |
| `POST` | `/api/indexes/:id/like` | Создатель | Param: `id`, Body: `{ value: 1/0 }` | Постановка (`1`) или снятие (`0`) отметки «Нравится» |

---

## 5. Запуск и тестирование проекта

### Шаг 1. Запуск инфраструктуры в Docker
```bash
docker compose up -d
```
Поднимаются 4 сервиса:
- **PostgreSQL** — порт `5435`
- **Adminer** — `http://localhost:8081`
- **MinIO** — порт `9000` (API) и `9001` (Консоль)
- **Redis** — порт `6379` (хранилище сессий)

### Шаг 2. Запуск бэкенда NestJS
```bash
cd database_query_optimizer
npm install
npm run start:dev
```
Сервер будет доступен по адресу: **`http://localhost:3000/api`**.

### Шаг 3. Документация Swagger UI
Откройте браузер по адресу: **`http://localhost:3000/api/docs`**.
1. Выполните метод `POST /api/auth/login` с логином `pg_expert` и паролем `password123`.
2. Скопируйте полученный `sessionId`.
3. Нажмите кнопку **Authorize** в правом верхнем углу, вставьте `sessionId` и сохраните.
4. Теперь все защищенные методы создателя будут выполняться от имени авторизованного пользователя.

### Шаг 4. Проверка содержимого Redis в консоли
```bash
# Список активных сессий
docker exec lab_redis redis-cli KEYS "*"

# Просмотр ID пользователя в сессии
docker exec lab_redis redis-cli GET "session:<ваш-uuid>"

# Просмотр оставшегося времени жизни TTL (в секундах)
docker exec lab_redis redis-cli TTL "session:<ваш-uuid>"
```
