<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observer](https://observer.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## Дополнительное задание: индексы, пагинация и Redis

Используйте отдельный учебный PostgreSQL, Redis и MinIO (или S3-совместимое хранилище), не рабочую БД. Настройте `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `REDIS_HOST`, `REDIS_PORT`, `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` (опционально `MINIO_REGION`). Не добавляйте локальные секреты в Git.

В `database_query_optimizer/` выполните `npm ci` и `npm run build`, затем запустите `PORT=3108 DB_SYNCHRONIZE=true node dist/main.js` для создания схемы и начальных записей. Из корня репозитория:

```sh
psql "$DEMO_DATABASE_URL" -v demo_seed_confirm=1 -f scripts/demo_optimizer_seed.sql
psql "$DEMO_DATABASE_URL" -v demo_benchmark_confirm=1 -f scripts/demo_optimizer_benchmark.sql
python3 scripts/verify-feed.py --api http://127.0.0.1:3108 --redis-port <порт-Redis>
```

- Seed добавляет 120 000 синтетических карточек и 14 примеров CLIP. Повторный запуск не изменяет существующие записи. Бенчмарк сравнивает планы страницы и точного `COUNT` с составным индексом `(status, cardinality, id)` и без него. Запускайте бенчмарк отдельно от HTTP-показа: DDL берёт блокировку, а удаление индекса выполняется внутри откатываемой транзакции.
- `GET /api/indexes?minCardinality=420042&limit=24&offset=0` возвращает `items`, `total`, `limit` и `offset`. Историческое имя `minCardinality` означает **точное** равенство; после загрузки seed фильтр находит 750 синтетических карточек. Порядок — по `id`, размер страницы по умолчанию 24, максимум 100.
- `GET /api/indexes/feed` читает текущую карточку или создаёт случайную партию до 100 ID. `?next=true&id=<текущий ID>` продвигает курсор, а `?id=<ID>` читает карточку без изменения курсора. Сохраняйте cookies между запросами. Скрипт проверки использует `redis-cli`, проверяет переход из позиции 100 в 1, отсутствие повторов ID внутри партии и независимость гостевой и авторизованной лент. Он создаёт одного случайного тестового пользователя.
- Гостевой `GET /api/indexes/clip-candidates?afterId=0&limit=100` возвращает `items` (`id`, `shortDescription`) и `nextAfterId`. Передавайте курсор до `null`. Синтетические записи бенчмарка исключены, поиск по фото выполняется локально в Tauri.

В каталоге бэкенда `npm test` запускает unit-тесты, а `npm run test:e2e` проверяет HTTP с запущенными сервисами учебного стенда. Swagger доступен по `/api/docs`.

## Дополнительное задание: асинхронный поворот GLB

Ветка `extras/async-rotation` включает возможности `extras/indexes` и добавляет работу с отдельным Python/Asyncio worker. Для воспроизводимой демонстрации создайте пустую учебную БД на этой ветке, затем выполните seed по инструкции выше: он назначает комплектную модель `/assets/demo-index-model.glb`. Seed не перезаписывает карточки, уже созданные на ветке без GLB.

1. В NestJS задайте `ASYNC_ROTATION_URL=http://127.0.0.1:8108/rotate`. В worker задайте `ROTATION_MAIN_API=http://127.0.0.1:3108/api`. Передайте обоим процессам один `ROTATION_RESULT_KEY` через закрытое окружение; не записывайте его в Git. Worker по умолчанию слушает `127.0.0.1:8108` и ждёт 6 секунд перед callback.
2. Прочитайте ленту через `GET /api/indexes/feed`, сохраните cookie, затем перейдите к следующей карточке через `GET /api/indexes/feed?next=true&id=<текущий ID>`. Успешное продвижение инициирует `POST /rotate` к worker без ожидания расчёта. Ответ ленты содержит `current.modelUrl`, `current.rotationX` и `current.rotationY`. Последующие `GET /api/indexes/feed?id=<новый ID>` не двигают курсор и не запускают worker повторно. Сравните углы до и после callback.
3. Отдельно проверьте `POST /rotate` на порту worker с JSON `{"id":1,"rotationX":0.5,"rotationY":1.0}`, заменив `1` на ID опубликованной карточки. Ожидается `202`; новые углы видны приблизительно через 6 секунд. Для проверки callback в закрытом окружении отправьте `PUT /api/indexes/<ID>/rotation` с JSON полями `rotationX`, `rotationY` и заголовком `X-Result-Key`: `204` при успехе, `401` без верного ключа.
4. В авторизованной сессии приложите `model` как поле multipart-запроса `POST /api/indexes` для создания или обновления черновика. Можно использовать небольшой `public/assets/demo-index-model.glb` из каталога бэкенда. Повреждённый GLB с невалидным JSON отклоняется с `400`. Опубликуйте черновик и откройте `modelUrl`. Для браузерного чтения подписанного URL разрешите `GET` с origin веб-клиента в CORS бакета MinIO.
