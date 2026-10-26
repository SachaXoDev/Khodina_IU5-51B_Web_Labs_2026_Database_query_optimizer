#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Генератор отчета по Лабораторной работе №5
в точном формате "WEB 3 лаба.docx" / "WEB 4 лаба.docx":
- Без титульного листа
- Начинается сразу с рисунков:
  [Место для скриншота]
  Рисунок X - Название
  Описание/Пояснение
- Расчет аппаратных требований на 1 листе
- Ответы на контрольные вопросы
"""

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_shading(cell, color_hex):
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def format_run(run, font_name="Times New Roman", size_pt=11, bold=False, italic=False, color_rgb=(0, 0, 0)):
    run.font.name = font_name
    run.font.size = Pt(size_pt)
    run.bold = bold
    run.italic = italic
    run.font.color.rgb = RGBColor(*color_rgb)

def add_figure_block(doc, fig_num, title, details_dict, explanation):
    # 1. [Место для скриншота]
    p_img = doc.add_paragraph()
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_img.paragraph_format.space_before = Pt(6)
    p_img.paragraph_format.space_after = Pt(2)
    run_img = p_img.add_run("[Место для скриншота]")
    format_run(run_img, font_name="Times New Roman", size_pt=11, italic=True, color_rgb=(128, 128, 128))

    # 2. Рисунок X - Название
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(2)
    p_title.paragraph_format.space_after = Pt(4)
    run_title = p_title.add_run(f"Рисунок {fig_num} - {title}")
    format_run(run_title, font_name="Times New Roman", size_pt=12, bold=True)

    # 3. Детали и Пояснение
    p_desc = doc.add_paragraph()
    p_desc.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_desc.paragraph_format.space_before = Pt(2)
    p_desc.paragraph_format.space_after = Pt(12)
    p_desc.paragraph_format.line_spacing = 1.15

    # Заголовок параметров блока
    block_header = details_dict.get("HEADER", "Параметры:")
    run_h = p_desc.add_run(f"{block_header}\n")
    format_run(run_h, font_name="Times New Roman", size_pt=11, bold=True)

    for k, v in details_dict.items():
        if k == "HEADER":
            continue
        run_bullet = p_desc.add_run(f"• {k}: ")
        format_run(run_bullet, font_name="Times New Roman", size_pt=11, bold=True)
        run_val = p_desc.add_run(f"{v}\n")
        format_run(run_val, font_name="Times New Roman", size_pt=11, bold=False)

    p_desc.add_run("\n")
    run_exp_label = p_desc.add_run("Пояснение: ")
    format_run(run_exp_label, font_name="Times New Roman", size_pt=11, bold=True)
    run_exp_val = p_desc.add_run(explanation)
    format_run(run_exp_val, font_name="Times New Roman", size_pt=11, bold=False)

def create_report():
    doc = docx.Document()

    # Поля страницы как в предыдущих лабах (0.79 дюйма = 2 см)
    for section in doc.sections:
        section.top_margin = Inches(0.79)
        section.bottom_margin = Inches(0.79)
        section.left_margin = Inches(0.79)
        section.right_margin = Inches(0.79)

    # =========================================================================
    # БЛОК СКРИНШОТОВ (1 - 9) в точном порядке показа
    # =========================================================================

    # Скриншот 1
    add_figure_block(
        doc,
        fig_num=1,
        title="Страница каталога услуг «Плитка» с фильтром по Cardinality",
        details_dict={
            "HEADER": "Параметры страницы фронтенда:",
            "URL в браузере": "http://127.0.0.1:5175/ (маршрут /)",
            "Компонент": "frontend/src/pages/ListPage.tsx",
            "Режим пользователя": "Гость (неавторизованный)",
            "Элементы интерфейса": "Сетка из 2 колонок карточек, поле ввода Cardinality, кнопка «Найти», ползунок слайдера, кнопка удаления ✕, бейджи лайков, TabBar из 4 пунктов.",
        },
        explanation="Отображение базовой страницы каталога услуг гостя в вертикальном мобильном фрейме (390×844 px). "
                    "Карточки загружаются напрямую из mock-коллекции без участия бэкенда. "
                    "В нижней навигационной панели доступны ровно 2 вкладки: «Лента» и «Плитка»; «Добавление» и «Вход» заблокированы для гостя (🔒 disabled)."
    )

    # Скриншот 2
    add_figure_block(
        doc,
        fig_num=2,
        title="Страница «Лента» (Reels / TikTok Vibes Feed)",
        details_dict={
            "HEADER": "Параметры страницы ленты:",
            "URL в браузере": "http://127.0.0.1:5175/feed (маршрут /feed)",
            "Компонент": "frontend/src/pages/FeedPage.tsx",
            "Элементы управления": "Кнопка «Лайк», кнопка «Далее» (циклическая навигация), плашки CARDINALITY и ВРЕМЯ создания (~Xs), раскрывающееся описание.",
        },
        explanation="Полноэкранный медиа-слой с циклической сменой услуг из локального состояния cards. "
                    "Справа размещены боковые плашки метрик и кнопка лайка. "
                    "Снизу поверх видео наложен блок с названием индекса, типом (B-Tree, BRIN), связкой таблицы и столбца, "
                    "а также кнопка «больше / меньше», раскрывающая полное описание оптимизации плана EXPLAIN."
    )

    # Скриншот 3
    add_figure_block(
        doc,
        fig_num=3,
        title="Страница «Подробнее» (Детальный просмотр услуги с кнопкой «✕ Закрыть»)",
        details_dict={
            "HEADER": "Параметры детальной страницы:",
            "URL в браузере": "http://127.0.0.1:5175/detail/1 (маршрут /detail/:id)",
            "Компонент": "frontend/src/pages/DetailPage.tsx",
            "Хуки маршрутизации": "useParams<{ id: string }>(), useNavigate()",
            "Элементы экрана": "Кнопка «✕ Закрыть» в левом верхнем углу, полноэкранный медиа-слой выбранного индекса, боковые метрики, подробное описание.",
        },
        explanation="Третья страница SPA-приложения, предназначенная для углубленного изучения оптимизации конкретного индекса. "
                    "Открывается по прямому роуту или клику. Кнопка «✕ Закрыть» осуществляет возврат к каталогу плитки через navigate(ROUTES.LIST)."
    )

    # Скриншот 4
    add_figure_block(
        doc,
        fig_num=4,
        title="Отображение изображения по умолчанию на карточках каталога",
        details_dict={
            "HEADER": "Параметры карточек каталога:",
            "Файл компонента": "frontend/src/components/IndexCard.tsx",
            "Тестовые карточки": "Карточка 3 (idx_users_email_hash) и Карточка 4 (idx_products_tags_gin)",
            "Состояние полей": "imageUrl: '' (пустая строка)",
            "Отображаемый ресурс": "frontend/public/DefaultImage.jpg",
            "Индикатор в UI": "Зеленый бейдж «default image» в левом нижнем углу превью.",
        },
        explanation="При отсутствии URL изображения в объекте услуги (или при ошибке загрузки) компонент IndexCard "
                    "автоматически подставляет локальное статическое изображение DefaultImage.jpg и выводит бейдж «default image» для наглядного контроля."
    )

    # Скриншот 5
    add_figure_block(
        doc,
        fig_num=5,
        title="Код реализации Fallback-медиа по умолчанию (DefaultImage.jpg и DefaultVideo.mp4)",
        details_dict={
            "HEADER": "Фрагменты исходного кода:",
            "Файлы проекта": "frontend/src/components/IndexCard.tsx, frontend/src/pages/FeedPage.tsx, frontend/public/",
            "Статические ассеты": "DefaultImage.jpg (23.8 КБ), DefaultVideo.mp4 (66 КБ)",
            "Обработчики": "onError={(e) => { e.target.src = defaultImage; }}, fallback-ветка тега <video>.",
        },
        explanation="Показан исходный код компонентов, обеспечивающий отказоустойчивость медиа-слоя: "
                    "в случае пустых значений полей imageUrl/videoUrl или сбоя сети подставляются локальные файлы-заглушки из директории public/."
    )

    # Скриншот 6
    add_figure_block(
        doc,
        fig_num=6,
        title="Код компонента фильтрации FilterBar и передаваемые Props",
        details_dict={
            "HEADER": "Интерфейс и библиотека компонентов:",
            "Файл компонента": "frontend/src/components/FilterBar.tsx",
            "Используемые компоненты": "Form, Form.Control, Form.Range, Button из библиотеки 'react-bootstrap'",
            "Интерфейс Props": "interface FilterBarProps { cardinality: string; setCardinality: (val: string) => void; onSubmit: () => void; }",
        },
        explanation="Компонент фильтра построен на контролируемых компонентах React-Bootstrap: числовом инпуте Form.Control, "
                    "слайдере Form.Range и кнопке Button. Фирменные стили проекта переопределяют дефолтный синий цвет Bootstrap на неоновый зеленый #1fdc6f."
    )

    # Скриншот 7
    add_figure_block(
        doc,
        fig_num=7,
        title="Код применения фильтрации по точному равенству Cardinality (= 10000)",
        details_dict={
            "HEADER": "Параметры фильтрации mock-данных:",
            "Файл логики API": "frontend/src/modules/indexesApi.ts",
            "Файл страницы плитки": "frontend/src/pages/ListPage.tsx",
            "Условие фильтрации": "result = result.filter((x) => x.cardinality === Number(filters.minCardinality));",
            "Тестовый ввод": "cardinality = 10000 -> возвращается ровно 1 индекс idx_orders_customer_id.",
        },
        explanation="Код обработчика формы и функции выборки данных. Фильтрация выполняется по строгому точному совпадению (===), "
                    "что гарантирует полное соответствие логике бэкенда из ЛР-2 (WHERE index.cardinality = :minCardinality)."
    )

    # Скриншот 8
    add_figure_block(
        doc,
        fig_num=8,
        title="Корневое состояние и передача данных через Outlet context (без Redux и Context API)",
        details_dict={
            "HEADER": "Архитектура локального состояния:",
            "Файл макета": "frontend/src/AppLayout.tsx",
            "Хранилище стейта": "const [cards, setCards] = useState<IndexItem[]>(MOCK_INDEXES);",
            "Передача в страницы": "<Outlet context={{ cards, setCards }} />",
            "Ограничения задания": "Полное отсутствие Redux, @reduxjs/toolkit и React Context API (createContext).",
        },
        explanation="Продемонстрирован корневой компонент AppLayout, в котором инициализируется состояние карточек через useState. "
                    "Доступ к данным на всех страницах (Плитка, Лента, Подробнее) осуществляется через стандартный хук useOutletContext библиотеки react-router-dom."
    )

    # Скриншот 9
    add_figure_block(
        doc,
        fig_num=9,
        title="Все используемые хуки в страницах приложения",
        details_dict={
            "HEADER": "Перечень задействованных хуков React и React Router:",
            "useState": "Управление локальным раскрытием текста isExpanded, текущим индексом в ленте currentIndex, значением фильтра cardinality.",
            "useEffect": "Синхронизация выбранного индекса по URL-параметру ?id= при переходе из каталога в ленту.",
            "useOutletContext": "Получение единого состояния cards и функции обновления setCards без использования Context API.",
            "useParams, useNavigate, useSearchParams": "Маршрутизация, получение ID детальной страницы и чтение query-параметров адресной строки.",
        },
        explanation="Фрагменты кода со всеми используемыми хуками проекта, демонстрирующие чистое функциональное программирование "
                    "в React 19 без сторонних библиотек управления состоянием."
    )

    # =========================================================================
    # РАСЧЕТ АППАРАТНЫХ ТРЕБОВАНИЙ (СТРОГО ПО СЛАЙДУ ПРЕПОДАВАТЕЛЯ)
    # =========================================================================
    doc.add_page_break()

    p_hw_h = doc.add_paragraph()
    p_hw_h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_hw_h.paragraph_format.space_before = Pt(6)
    p_hw_h.paragraph_format.space_after = Pt(8)
    run_hw_h = p_hw_h.add_run("РАСЧЕТ АППАРАТНЫХ ТРЕБОВАНИЙ")
    format_run(run_hw_h, font_name="Times New Roman", size_pt=13, bold=True)

    p_calc = doc.add_paragraph()
    p_calc.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_calc.paragraph_format.space_before = Pt(2)
    p_calc.paragraph_format.space_after = Pt(6)
    p_calc.paragraph_format.line_spacing = 1.25

    calc_text = (
        "• В системе работают 250 инженеров БД и 20 архитекторов (администраторов). Пусть инженер формирует 70 заявок на расчёт и построение индексов в сутки:\n"
        "      N_requests/day = 250 × 70 = 17500 заявок/сутки\n\n"
        "• Вычислим RPS с учётом того, что на одну заявку приходится 14 HTTP-запросов, а каждый архитектор даёт ещё по одному RPS из-за polling (мониторинг статуса выполнения DDL в СУБД):\n"
        "      RPS = (N_requests/day × 14) / 28800 + 20 × 1 = (17500 × 14) / 28800 + 20 ≈ 28,51 запросов/с\n\n"
        "• Расчет процессорных ядер при производительности 1 ядра RPS_core = 500 запросов/с и коэффициенте запаса k_reserve = 1,5:\n"
        "      N_cores = (RPS / RPS_core) × k_reserve = (28,51 / 500) × 1,5 ≈ 1 ядро\n\n"
        "• Требуемый объем оперативной памяти (по нормативу: на 1 ядро по 4 ГБ ОП):\n"
        "      RAM = 4 × N_cores = 4 × 1 = 4 ГБ\n\n"
        "• Рассчитаем размеры записей в таблице database_indexes (ид заявки-индекса и 2 пользователей — по 8 байт, 3 временные метки — по 8 байт, текстовые поля имени индекса и таблицы — 100 байт, тип и статус — 20 байт):\n"
        "      S_index = 8 × 3 + 8 × 3 + 100 + 20 = 168 байт\n\n"
        "• Годовой прирост базы данных при N_year = 365 × 17500 = 6 387 500 заявок в год и связях 3 × S_metric (по 56 байт на логи профилирования):\n"
        "      DB_growth/year = (N_year × (S_index + 3 × S_metric)) / (1024 × 1024 × 1024) = (6387500 × (168 + 3 × 56)) / 1073741824 ≈ 2 ГБ/год\n\n"
        "• Требуемый размер жесткого диска с учетом прироста БД за 5 лет:\n"
        "      V_5years = DB_growth/year × 5 = 2 × 5 = 10 ГБ (с учетом B-Tree индексов, журналов WAL и запаса СУБД: не менее 20 ГБ SSD)."
    )
    run_calc = p_calc.add_run(calc_text)
    format_run(run_calc, font_name="Times New Roman", size_pt=11)

    # =========================================================================
    # КОНТРОЛЬНЫЕ ВОПРОСЫ
    # =========================================================================
    doc.add_page_break()

    p_qa_h = doc.add_paragraph()
    p_qa_h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_qa_h.paragraph_format.space_before = Pt(6)
    p_qa_h.paragraph_format.space_after = Pt(8)
    run_qa_h = p_qa_h.add_run("ОТВЕТЫ НА КОНТРОЛЬНЫЕ ВОПРОСЫ")
    format_run(run_qa_h, font_name="Times New Roman", size_pt=13, bold=True)

    qa_list = [
        (
            "Вопрос 1: Что такое React? Ключевые особенности библиотеки",
            "React — декларативная библиотека JavaScript/TypeScript с открытым исходным кодом для построения динамических SPA-интерфейсов. "
            "Ключевые особенности: компонентный подход (интерфейс декомпозируется на независимые повторно используемые модули), однонаправленный поток данных (Props Down, Events Up), "
            "использование легковесного виртуального DOM (Virtual DOM) и алгоритма согласования (Reconciliation/Fiber), минимизирующего дорогостоящие операции перерисовки реального DOM браузера."
        ),
        (
            "Вопрос 2: В чем разница между Props и State (состоянием)?",
            "Props (свойства) — неизменяемые (read-only) входные параметры, передаваемые компоненту от родительского компонента. Дочерний компонент не имеет права изменять переданные props. "
            "State (состояние) — внутренние реактивные данные компонента, объявленные через хук useState(). При вызове setter-функции состояния React регистрирует изменение и инициирует повторный рендеринг компонента."
        ),
        (
            "Вопрос 3: Чем отличается React-компонент от React-элемента?",
            "React-элемент — это легковесный иммутабельный JavaScript-объект, описывающий конкретный узел виртуального дерева DOM (результат вызова React.createElement или JSX-тега вида <IndexCard />). "
            "React-компонент — это функция или класс (чертеж/шаблон), принимающий props и возвращающий дерево React-элементов."
        ),
        (
            "Вопрос 4: Назначение и различия хуков useState и useEffect?",
            "useState(initialValue) создает реактивное локальное состояние и функцию его обновления. "
            "useEffect(callback, dependencies) предназначен для управления побочными эффектами (side effects): отправка запросов, установка таймеров, подписка на события браузера. "
            "Функция обратного вызова useEffect выполняется асинхронно после фазы отрисовки (Commit phase) браузером."
        ),
        (
            "Вопрос 5: Жизненный цикл компонента и его соответствие функциональным хукам",
            "Жизненный цикл состоит из трех фаз: Mounting (монтирование/создание в DOM), Updating (обновление при смене props/state) и Unmounting (размонтирование/удаление из DOM). "
            "В функциональных компонентах этапы моделируются хуком useEffect:\n"
            "• Mounting: useEffect(fn, []) — пустой массив зависимостей, выполняется один раз при старте;\n"
            "• Updating: useEffect(fn, [deps]) — перезапускается при изменении зависимостей;\n"
            "• Unmounting: возврат функции очистки: useEffect(() => () => cleanup(), [])."
        ),
        (
            "Вопрос 6: Сравнение инструментов сборки: Vite и Babel",
            "Babel — транспайлер, компилирующий современный синтаксис ES6+/TSX в совместимый со старыми браузерами код ES5 через построение AST-дерева, требующий полного бандлинга при каждом сохранении файла. "
            "Vite — современный инструмент сборки нового поколения: в режиме разработки отдает нативные ES-модули (ESM) без предварительной сборки бандла и компилирует файлы через молниеносный esbuild на Go, "
            "обеспечивая мгновенный запуск dev-сервера и мгновенный HMR (Hot Module Replacement), а для production использует оптимизированный бандлер Rollup."
        ),
    ]

    for q_title, q_ans in qa_list:
        p_q = doc.add_paragraph()
        p_q.paragraph_format.space_before = Pt(6)
        p_q.paragraph_format.space_after = Pt(2)
        run_q = p_q.add_run(q_title)
        format_run(run_q, font_name="Times New Roman", size_pt=11.5, bold=True)

        p_a = doc.add_paragraph()
        p_a.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_a.paragraph_format.space_before = Pt(2)
        p_a.paragraph_format.space_after = Pt(8)
        p_a.paragraph_format.line_spacing = 1.15
        run_a = p_a.add_run(q_ans)
        format_run(run_a, font_name="Times New Roman", size_pt=11)

    # Сохраняем в корневую директорию рядом с остальными лабами
    out_path_1 = "Отчет_ЛР5_Ходина_ИУ5_51Б.docx"
    out_path_2 = "../WEB 5 лаба.docx"
    doc.save(out_path_1)
    doc.save(out_path_2)
    print(f"Отчет успешно сохранен в файлы:\n1. {out_path_1}\n2. {out_path_2}")

if __name__ == "__main__":
    create_report()
