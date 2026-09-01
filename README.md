# Лабораторные работы по курсу "Разработка интернет-приложений"

**Тема проекта:** Оптимизатор запросов к базе данных (Database Query Optimizer)  
**Автор:** Ходина Александра Павловна, группа ИУ5-51Б  
**Семестр:** 5 (Осень 2026)

---

## 📌 Лабораторная работа №1
**Тема:** Выбор варианта-темы на весь курс, знакомство с разработкой бэкенда и разработка дизайна для 3 страниц  
**Ветка:** `lab-1-backend-and-design`

### Описание функционала:
- **Лента оптимизаций (`/database-indexes/feed`):**
  - Показ детальной карточки услуги по ID и переход к следующей опубликованной услуге (`?next=true`).
  - Раскрытие/скрытие полного текста описания («еще / меньше») без JavaScript (Pure CSS).
  - Отображение и интерактивное переключение счетчика лайков.
- **Каталог услуг (`/database-indexes/list`):**
  - Сетка 2×2 опубликованных B-Tree индексов.
  - Поиск и фильтрация карточек исключительно по времени выполнения (`avgQueryTimeMs`).
  - Динамическое отображение статуса лайка пользователя.
- **Страница добавления (`/database-indexes/create`):**
  - Экран B-Tree Creator в стиле Dark UI (Figma).
  - Отображение единственной услуги из коллекции в статусе `draft` (черновик).
  - Скрытые услуги со статусом `deleted` (удален).

---

## 🛠 Стек технологий
- **Backend:** Node.js, NestJS, TypeScript
- **Шаблонизатор:** Handlebars (HBS)
- **Стилизация:** Pure CSS3 (Dark Theme, адаптивный мобильный интерфейс)
- **Медиа-хранилище:** MinIO (S3-compatible Object Storage)
- **Контейнеризация:** Docker, Docker Compose

---

## 🚀 Запуск проекта

1. **Клонирование репозитория:**
   ```bash
   git clone https://github.com/SachaXoDev/Khodina_IU5-51B_Web_Labs_2026_Database_query_optimizer.git
   cd Khodina_IU5-51B_Web_Labs_2026_Database_query_optimizer
   ```

2. **Запуск инфраструктуры (MinIO):**
   ```bash
   docker-compose up -d
   ```

3. **Установка зависимостей и запуск сервера:**
   ```bash
   cd database_query_optimizer
   npm install
   npm run start:dev
   ```

4. **Доступные страницы:**
   - Лента: [http://localhost:3000/database-indexes/feed](http://localhost:3000/database-indexes/feed)
   - Каталог: [http://localhost:3000/database-indexes/list](http://localhost:3000/database-indexes/list)
   - Создание / Черновик: [http://localhost:3000/database-indexes/create](http://localhost:3000/database-indexes/create)
