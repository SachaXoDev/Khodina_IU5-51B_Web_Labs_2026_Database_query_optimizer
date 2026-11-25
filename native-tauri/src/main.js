import './style.css';
import { apiOrigin, catalog, detail, PAGE_SIZE, thumbnail } from './api.js';
import { imageSearch } from './image-search.js';

const app = document.querySelector('#app');
document.querySelector('#api-origin').textContent = apiOrigin;
const formatNumber = new Intl.NumberFormat('ru-RU').format;

const listPage = document.createElement('section');
listPage.innerHTML = `
  <div class="hero">
    <p class="eyebrow">Оптимизация запросов PostgreSQL</p>
    <h1>Каталог индексов</h1>
    <p class="muted">Поиск по названию, таблице, типу индекса и числу строк.</p>
  </div>
  <form class="surface controls filters" aria-label="Фильтры каталога">
    <label>Поиск<input name="search" type="search" maxlength="150" placeholder="Название, таблица или описание"></label>
    <label>Тип индекса<select name="indexType">
      <option value="">Любой тип</option><option>B-Tree</option><option>BRIN</option><option value="Hash">Хеш</option><option>GIN</option>
    </select></label>
    <label>Число строк (точно)<input name="minCardinality" type="number" min="0" max="2147483647" step="1" placeholder="Не ограничено"></label>
    <button type="submit" class="primary">Применить фильтры</button>
    <button type="reset">Сбросить</button>
  </form>
  <div class="image-search-slot"></div>
  <div class="section-head"><h2>Опубликованные индексы</h2><p class="message" role="status"></p></div>
  <div class="catalog-grid"></div>
  <nav class="pager" aria-label="Страницы каталога" hidden>
    <button type="button">Назад</button><span></span><button type="button">Далее</button>
  </nav>`;
listPage.querySelector('.image-search-slot').replaceWith(imageSearch());
const detailPage = document.createElement('section');
detailPage.hidden = true;
app.append(listPage, detailPage);

const filters = listPage.querySelector('.filters');
const listStatus = listPage.querySelector('.section-head .message');
const grid = listPage.querySelector('.catalog-grid');
const pager = listPage.querySelector('.pager');
const [previous, next] = pager.querySelectorAll('button');
let listRun;
let detailRun;
let offset = 0;
let applied = { search: '', indexType: '', minCardinality: '' };

filters.addEventListener('submit', (event) => {
  event.preventDefault();
  const fields = new FormData(filters);
  applied = Object.fromEntries([...fields].map(([key, value]) => [key, value.trim()]));
  loadList(0);
});
filters.addEventListener('reset', () => {
  applied = { search: '', indexType: '', minCardinality: '' };
  loadList(0);
});
previous.addEventListener('click', () => loadList(Math.max(0, offset - PAGE_SIZE)));
next.addEventListener('click', () => loadList(offset + PAGE_SIZE));

async function loadList(pageOffset) {
  dispose(listRun);
  const run = listRun = requestScope();
  grid.replaceChildren();
  pager.hidden = true;
  listStatus.classList.remove('error');
  listStatus.textContent = 'Загрузка каталога…';
  try {
    const { items, total } = await catalog({ ...applied, offset: pageOffset }, run.signal);
    if (run.signal.aborted) return;
    if (total > 0 && pageOffset >= total) {
      loadList(Math.floor((total - 1) / PAGE_SIZE) * PAGE_SIZE);
      return;
    }
    offset = pageOffset;
    if (total === 0 || items.length === 0) {
      listStatus.textContent = 'Нет индексов по заданным фильтрам.';
      return;
    }
    listStatus.textContent = `Показано ${formatNumber(offset + 1)}–${formatNumber(offset + items.length)} из ${formatNumber(total)}`;
    grid.append(...items.map((item) => card(item, run)));
    previous.disabled = offset === 0;
    next.disabled = offset + PAGE_SIZE >= total;
    pager.querySelector('span').textContent = `Стр. ${formatNumber(1 + offset / PAGE_SIZE)} из ${formatNumber(Math.ceil(total / PAGE_SIZE))}`;
    pager.hidden = false;
  } catch (error) {
    if (!run.signal.aborted) showError(listStatus, error, () => loadList(pageOffset));
  }
}

function card(item, run) {
  const article = el('article', '', 'card');
  const link = el('a');
  link.href = `#/indexes/${item.id}`;
  const body = el('div', '', 'card-body');
  body.append(el('p', item.indexType || 'Индекс', 'eyebrow'), el('h3', item.indexName),
    el('p', [item.tableName, item.columnName].filter(Boolean).join('.'), 'mono muted'),
    el('p', item.shortDescription || 'Краткого описания нет.', 'description'));
  link.append(picture(item, run), body);
  article.append(link);
  return article;
}

async function loadDetail(id) {
  dispose(detailRun);
  const run = detailRun = requestScope();
  const back = el('a', '← В каталог', 'back');
  back.href = '#/';
  const status = el('p', 'Загрузка индекса…', 'message');
  status.setAttribute('role', 'status');
  detailPage.replaceChildren(back, status);
  back.focus();
  try {
    const item = await detail(id, run.signal);
    if (run.signal.aborted) return;
    const title = el('div', '', 'hero detail-hero');
    const heading = el('h1', item.indexName);
    title.append(el('p', item.indexType || 'Опубликованный индекс', 'eyebrow'), heading);
    const article = el('article', '', 'surface detail-body');
    const text = el('div');
    text.append(el('h2', 'Об индексе'), el('p', item.fullDescription || item.shortDescription || 'Описания нет.', 'full-description'));
    const metadata = el('dl');
    const cardinality = Number.isFinite(item.cardinality) ? formatNumber(item.cardinality) : '—';
    for (const [name, value] of [
      ['Таблица', item.tableName], ['Столбец', item.columnName], ['Тип индекса', item.indexType], ['Число строк', cardinality],
      ['Автор', item.authorUsername], ['Дата публикации', formatDate(item.publishedAt)],
      ['Лайки', Number.isFinite(item.likesCount) ? formatNumber(item.likesCount) : '—'],
    ]) metadata.append(el('dt', name), el('dd', value || '—'));
    text.append(metadata);
    article.append(picture(item, run), text);
    status.replaceWith(title, article);
  } catch (error) {
    if (!run.signal.aborted) showError(status, error, () => loadDetail(id));
  }
}

function picture(item, run) {
  const container = el('div', '', 'picture');
  const placeholder = el('span', item.imageUrl ? 'Загрузка изображения…' : 'Нет изображения');
  container.append(placeholder);
  if (!item.imageUrl) return container;
  (async () => {
    let src;
    try {
      const blob = await thumbnail(item.imageUrl, run.signal);
      if (run.signal.aborted) return;
      src = URL.createObjectURL(blob);
      run.urls.add(src);
      const image = el('img');
      image.alt = `Иллюстрация к индексу ${item.indexName}`;
      image.decoding = 'async';
      image.src = src;
      await image.decode();
      if (!run.signal.aborted) container.replaceChildren(image);
    } catch {
      if (!run.signal.aborted) placeholder.textContent = 'Изображение недоступно';
      if (src && run.urls.delete(src)) URL.revokeObjectURL(src);
    }
  })();
  return container;
}

function requestScope() {
  const controller = new AbortController();
  return { controller, signal: controller.signal, urls: new Set() };
}

function dispose(run) {
  if (!run) return;
  run.controller.abort();
  for (const url of run.urls) URL.revokeObjectURL(url);
  run.urls.clear();
}

function formatDate(value) {
  const date = Date.parse(value);
  return Number.isFinite(date) ? new Date(date).toLocaleDateString('ru-RU') : '';
}

function el(tag, text = '', className = '') {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

function showError(target, error, retry) {
  const button = el('button', 'Повторить');
  button.type = 'button';
  button.addEventListener('click', retry);
  target.classList.add('error');
  target.replaceChildren(el('span', error?.message ?? String(error)), button);
}

let listScroll = 0;
function route() {
  const match = /^#\/indexes\/(\d+)$/.exec(location.hash);
  const id = match ? Number(match[1]) : 0;
  const isDetail = Number.isSafeInteger(id) && id > 0;
  if (isDetail && !listPage.hidden) listScroll = window.scrollY;
  const restoreList = !isDetail && listPage.hidden;
  listPage.hidden = isDetail;
  detailPage.hidden = !isDetail;
  if (isDetail) {
    window.scrollTo(0, 0);
    loadDetail(id);
  } else {
    dispose(detailRun);
    detailRun = undefined;
    detailPage.replaceChildren();
    if (!listRun) loadList(0);
    if (restoreList) {
      listPage.querySelector('h1').tabIndex = -1;
      listPage.querySelector('h1').focus({ preventScroll: true });
      window.scrollTo(0, listScroll);
    }
  }
}
window.addEventListener('hashchange', route);
route();
