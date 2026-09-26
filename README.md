# Лабораторная работа №3: Разработка REST API веб-сервиса на NestJS

## Тема проекта
**«Оптимизатор запросов баз данных (Database Query Optimizer)»** — REST API веб-сервис для каталога рекомендуемых индексов PostgreSQL, управления черновиками, публикации, циклической ленты, системы лайков, медиа-хранилища MinIO и регистрации пользователей для дальнейшего использования в Single Page Application (SPA).

---

## 1. Стек технологий
- **Фреймворк:** NestJS 10 (TypeScript)
- **СУБД:** PostgreSQL 16
- **ORM:** TypeORM 0.3
- **Объектное хранилище медиа:** MinIO (S3-compatible)
- **Валидация и сериализация:** `class-validator`, `class-transformer`
- **Контейнеризация:** Docker & Docker Compose

---

## 2. Архитектура проекта и структура папок

```text
database_query_optimizer/
├── src/
│   ├── common/
│   │   └── current-user.singleton.ts     # Функция-singleton с константой пользователя (ID = 1)
│   ├── indexes/                          # Домен «Услуги / Индексы БД»
│   │   ├── dto/
│   │   │   ├── create-draft.dto.ts       # Валидация создания черновика (кнопка «Далее»)
│   │   │   ├── publish-index.dto.ts      # Валидация публикации услуги
│   │   │   ├── index-filters.dto.ts      # Фильтры каталога (?search, ?indexType)
│   │   │   ├── like-index.dto.ts         # Валидация лайка (value: 0 | 1)
│   │   │   └── index-response.dto.ts     # Сериализатор услуги и ленты (скрытие системных полей)
│   │   ├── entities/
│   │   │   ├── database-index.entity.ts  # Сущность «Индекс БД» (компактная структура)
│   │   │   └── index-like.entity.ts      # Таблица связей м-м с отдельным PK
│   │   ├── indexes.controller.ts         # REST API маршруты (/api/indexes)
│   │   ├── indexes.service.ts            # Бизнес-логика через ORM TypeORM
│   │   ├── minio.service.ts              # Загрузка картинок/видео в MinIO с латинскими именами
│   │   └── indexes.module.ts
│   ├── users/                            # Домен «Пользователи»
│   │   ├── dto/
│   │   │   ├── register-user.dto.ts      # Регистрация (username, password, role)
│   │   │   ├── login-user.dto.ts         # Заглушка аутентификации
│   │   │   └── user-response.dto.ts      # Ответ без пароля (@Exclude)
│   │   ├── entities/
│   │   │   └── user.entity.ts            # Сущность User (id, username, password, role)
│   │   ├── users.controller.ts           # REST API маршруты (/api/users)
│   │   ├── users.service.ts              # Бизнес-логика пользователей
│   │   └── users.module.ts
│   ├── app.module.ts                     # Главный модуль с подключением TypeORM
│   └── main.ts                           # GlobalPrefix('api'), ValidationPipe, ClassSerializer
├── public/media/                         # Начальные тестовые медиафайлы
├── docker-compose.yml                    # Контейнеры Postgres, Adminer, MinIO
├── lab3_postman_collection.json          # Готовая коллекция из 10+2 запросов для Postman
└── .env                                  # Переменные окружения
```

---

## 3. Требования ТЗ и их реализация

1. **Глобальный префикс `/api`**: Все эндпоинты начинаются с `/api/` (`app.setGlobalPrefix('api')`).
2. **REST API**: Использованы стандартные HTTP-методы (`GET`, `POST`, `PUT`, `DELETE`) и статус-коды (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`).
3. **Функция-Singleton для текущего пользователя**: Класс `CurrentUserSingleton` и функция `getCurrentUserId()` фиксируют пользователя-создателя константой `CURRENT_USER_ID = 1` для всех методов.
4. **Защита системных полей**: Клиенту запрещено изменять `id`, `status`, `authorId`, `createdAt`, `publishedAt`. Включён `ValidationPipe({ forbidNonWhitelisted: true })`.
5. **Бизнес-правила смены статусов**:
   - `POST /api/indexes` — создание черновика (`status: draft`).
   - `PUT /api/indexes/:id/publish` — перевод строго `draft -> published`. Повторная публикация или возврат в черновик запрещены.
6. **Мягкое удаление (Soft Delete)**: `DELETE /api/indexes/:id` выставляет `status = 'deleted'`. Удалённые услуги клиенту больше не возвращаются.
7. **Хранилище MinIO**: Изображения и видео выгружаются в бакет MinIO; имена файлов генерируются строго на латинице (например, `index_image_171000_abc.jpg`) и сохраняются в колонках БД `image_url` и `video_url`.
8. **Система лайков**: `POST /api/indexes/:id/like` принимает `value: 1` (поставить лайк) и `value: 0` (отменить лайк) от текущего пользователя.

---

## 4. Спецификация REST API маршрутов

### Домен Услуги (`/api/indexes`):
| Метод | URL | Описание |
|---|---|---|
| `GET` | `/api/indexes?search=...&indexType=...` | Список услуг с фильтрацией (только опубликованные) |
| `GET` | `/api/indexes/feed` | Лента опубликованных услуг (без ID — первый элемент) |
| `GET` | `/api/indexes/feed?id=1&next=true` | Переход к следующему элементу ленты по ID |
| `GET` | `/api/indexes/draft` | Получение черновика текущего пользователя (без ID в URL) |
| `GET` | `/api/indexes/:id` | Просмотр опубликованной услуги по ID |
| `POST` | `/api/indexes` | Создание черновика с картинкой и видео (`multipart/form-data`) |
| `PUT` | `/api/indexes/:id/publish` | Публикация черновика (`draft -> published`) |
| `DELETE`| `/api/indexes/:id` | Мягкое удаление услуги (`soft delete`) |
| `POST` | `/api/indexes/:id/like` | Постановка (`1`) или отмена (`0`) лайка |

### Домен Пользователи (`/api/users`):
| Метод | URL | Описание |
|---|---|---|
| `POST` | `/api/users/register` | Регистрация нового пользователя (логин, пароль, роль) |
| `POST` | `/api/users/login` | Аутентификация (заглушка для лабораторной работы №4) |
| `POST` | `/api/users/logout` | Деавторизация (заглушка для лабораторной работы №4) |

---

## 5. Структура таблиц базы данных

### 1. `users`
- `id` (integer, PK, auto-increment)
- `username` (varchar, unique, not null)
- `password` (varchar, not null) — скрыт от клиентов в REST-ответах через `@Exclude()`
- `role` (varchar, default: `'user'`)

### 2. `index_likes` (связь многие-ко-многим)
- `id` (integer, отдельный PK, auto-increment)
- `user_id` (integer, FK -> `users.id` ON DELETE RESTRICT)
- `index_id` (integer, FK -> `database_indexes.id` ON DELETE RESTRICT)
- Ограничение уникальности: `UNIQUE(user_id, index_id)`

### 3. `database_indexes`
- `id` (integer, PK, auto-increment)
- `index_name` (varchar, not null) — обязательное поле по кнопке «Далее»
- `short_description` (text, nullable)
- `table_name` (varchar, default: `'users'`)
- `index_type` (varchar, default: `'B-Tree'`)
- `column_name` (varchar, default: `'id'`)
- `cardinality` (integer, default: `0`)
- `full_description` (text, nullable)
- `status` (enum: `draft`, `published`, `deleted`)
- `image_url` (varchar, nullable) — имя файла в MinIO на латинице
- `video_url` (varchar, nullable) — имя файла в MinIO на латинице
- `likes_count` (integer, default: `0`)
- `author_id` (integer, FK -> `users.id` ON DELETE RESTRICT)
- `created_at` (timestamp, системное поле)
- `published_at` (timestamp, системное поле)

---

## 6. Запуск и тестирование проекта

### Шаг 1. Запуск инфраструктуры (Docker)
```bash
docker compose up -d
```
Сервисы:
- **PostgreSQL:** порт `5435`
- **MinIO API:** порт `9000` (Web Console: `http://localhost:9001`, логин: `minioadmin`, пароль: `minioadminpassword`)
- **Adminer:** `http://localhost:8081`

### Шаг 2. Запуск бэкенда
```bash
cd database_query_optimizer
npm install
npm run start:dev
```
Сервер будет доступен по адресу: `http://localhost:3000/api`.

### Шаг 3. Тестирование через Postman / Insomnia
В корне репозитория находится файл **`lab3_postman_collection.json`**.
1. Откройте Postman ➔ нажмите **Import** ➔ выберите `lab3_postman_collection.json`.
2. В коллекции представлены все 10 обязательных запросов для демонстрации (скриншоты 1–10).
