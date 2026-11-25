import { candidates } from './api.js';
import sampleImage from '../fixtures/index_users_email.jpg?url';
import {
  bySimilarity, DEFAULT_THRESHOLD, MAX_FILE_BYTES, MAX_THRESHOLD, MAX_TOP_K, MIN_THRESHOLD, selectMatches,
} from './clip-ranking.js';

const formatThreshold = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format;
const formatScore = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format;
const DIAGNOSTIC_PAGE_SIZE = 100;

export function imageSearch() {
  const panel = document.createElement('details');
  panel.className = 'surface image-search';
  panel.innerHTML = `
    <summary>Поиск по изображению <span class="eyebrow">CLIP на устройстве</span></summary>
    <p>CLIP сравнивает фото со всеми доступными английскими описаниями опубликованных карточек (50–100 символов). Фото не отправляется на сервер.
      ${import.meta.env.VITE_BUNDLE_CLIP === '1' ? 'Модель уже входит в сборку.' : 'При первом запуске модель загружается из интернета.'}</p>
    <form class="controls" novalidate>
      <label class="image-file">Изображение (PNG, JPEG или WebP)
        <span class="file-picker"><span data-file-name>Выбрать файл</span><input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Выбрать изображение"></span>
      </label>
      <label>Порог нормализованного сходства <output></output><input type="range" min="${MIN_THRESHOLD}" max="${MAX_THRESHOLD}" step="0.01" value="${DEFAULT_THRESHOLD}"></label>
      <label>Макс. результатов<input type="number" min="1" max="${MAX_TOP_K}" step="1" value="1" required></label>
      <button type="submit" class="primary">Найти совпадения</button>
      <button type="button" data-sample>Проверить на примере</button>
      <button type="button" hidden>Отменить</button>
    </form>
    <p class="muted explain">Сходство = (косинус + 1) / 2. Это оценка, а не вероятность. Фильтры каталога не ограничивают поиск по фото.</p>
    <p class="message" role="status" aria-live="polite"></p>
    <ol class="matches" hidden></ol>
    <details class="raw-scores" hidden><summary>Оценки всех кандидатов</summary><ol class="matches"></ol>
      <div class="pager" hidden><button type="button" data-prev>Назад</button><span></span><button type="button" data-next>Далее</button></div>
    </details>`;
  const form = panel.querySelector('form');
  const picker = form.querySelector('[type=file]');
  const threshold = form.querySelector('[type=range]');
  const topK = form.querySelector('[type=number]');
  const output = form.querySelector('output');
  const submit = form.querySelector('[type=submit]');
  const sample = panel.querySelector('[data-sample]');
  const cancel = panel.querySelector('button[hidden]');
  const status = panel.querySelector('[role=status]');
  const result = panel.querySelector('.matches');
  const diagnostics = panel.querySelector('.raw-scores');
  const diagnosticList = diagnostics.querySelector('ol');
  const diagnosticPager = diagnostics.querySelector('.pager');
  const diagnosticPrev = diagnostics.querySelector('[data-prev]');
  const diagnosticNext = diagnostics.querySelector('[data-next]');
  let request;
  let worker;
  let ranking;
  let diagnosticOffset = 0;

  function setStatus(text, error = false) {
    status.textContent = text;
    status.classList.toggle('error', error);
  }

  function drawResults() {
    output.value = formatThreshold(Number(threshold.value));
    if (!ranking) return;
    const maxResults = topK.valueAsNumber;
    if (!Number.isInteger(maxResults) || maxResults < 1 || maxResults > MAX_TOP_K) {
      result.hidden = true;
      setStatus(`Число результатов должно быть целым от 1 до ${MAX_TOP_K}.`, true);
      return;
    }
    const rows = selectMatches(ranking, Number(threshold.value), maxResults);
    result.replaceChildren(...rows.map(matchRow));
    result.hidden = rows.length === 0;
    const passed = ranking.filter((row) => row.score >= Number(threshold.value)).length;
    setStatus(rows.length ? `Показано: ${rows.length}. Выше порога: ${passed}. Сравнено: ${ranking.length}.`
      : `Нет совпадений выше порога. Сравнено: ${ranking.length}. Лучшая оценка: ${formatScore(ranking[0].score)}.`);
  }


  function drawDiagnostics() {
    if (!diagnostics.open || !ranking) return;
    const end = Math.min(diagnosticOffset + DIAGNOSTIC_PAGE_SIZE, ranking.length);
    diagnosticList.start = diagnosticOffset + 1;
    diagnosticList.replaceChildren(...ranking.slice(diagnosticOffset, end).map(matchRow));
    diagnosticPager.hidden = ranking.length <= DIAGNOSTIC_PAGE_SIZE;
    diagnosticPager.querySelector('span').textContent = `${diagnosticOffset + 1}–${end} из ${ranking.length}`;
    diagnosticPrev.disabled = diagnosticOffset === 0;
    diagnosticNext.disabled = end === ranking.length;
  }

  diagnostics.addEventListener('toggle', drawDiagnostics);
  diagnosticPrev.addEventListener('click', () => {
    diagnosticOffset -= DIAGNOSTIC_PAGE_SIZE;
    drawDiagnostics();
  });
  diagnosticNext.addEventListener('click', () => {
    diagnosticOffset += DIAGNOSTIC_PAGE_SIZE;
    drawDiagnostics();
  });
  function clearResults() {
    ranking = undefined;
    result.hidden = true;
    diagnostics.hidden = true;
    diagnostics.open = false;
    result.replaceChildren();
    diagnosticOffset = 0;
    diagnosticList.replaceChildren();
  }

  function finish() {
    request = undefined;
    submit.disabled = false;
    picker.disabled = false;
    sample.disabled = false;
    cancel.hidden = true;
  }

  function stopWorker() {
    worker?.terminate();
    worker = undefined;
  }

  threshold.addEventListener('input', drawResults);
  topK.addEventListener('input', drawResults);
  drawResults();
  picker.addEventListener('change', () => {
    panel.querySelector('[data-file-name]').textContent = picker.files[0]?.name ?? 'Выбрать файл';
    clearResults();
    setStatus('');
  });
  cancel.addEventListener('click', () => {
    request?.abort();
    stopWorker();
    finish();
    setStatus('Поиск отменён.');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void search(picker.files[0]);
  });
  sample.addEventListener('click', () => void searchSample());

  async function searchSample() {
    if (request || sample.disabled) return;
    sample.disabled = true;
    try {
      const response = await fetch(sampleImage);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await search(new File([await response.blob()], 'cabinet.jpg', { type: 'image/jpeg' }));
    } catch (error) {
      console.warn('Не удалось прочитать встроенный пример CLIP', error);
      setStatus('Не удалось открыть встроенный пример.', true);
    } finally {
      if (!request) sample.disabled = false;
    }
  }

  async function search(file) {
    if (request) return;
    if (!Number.isInteger(topK.valueAsNumber) || topK.valueAsNumber < 1 || topK.valueAsNumber > MAX_TOP_K) {
      setStatus(`Число результатов должно быть целым от 1 до ${MAX_TOP_K}.`, true);
      return;
    }
    clearResults();
    if (!file || !/^image\/(png|jpeg|webp)$/.test(file.type) || file.size === 0 || file.size > MAX_FILE_BYTES) {
      setStatus('Выберите изображение PNG, JPEG или WebP размером до 10 МиБ.', true);
      return;
    }
    const run = new AbortController();
    request = run;
    submit.disabled = true;
    picker.disabled = true;
    sample.disabled = true;
    cancel.hidden = false;
    setStatus('Загрузка описаний из каталога…');
    try {
      const scores = [];
      for await (const entries of candidates(run.signal)) {
        if (request !== run) return;
        setStatus(`Обработка страницы описаний. Сравнено: ${scores.length}…`);
        worker ??= new Worker(new URL('./clip.worker.js', import.meta.url), { type: 'module' });
        scores.push(...await scorePage(worker, scores.length ? undefined : file, entries, scores.length, run.signal, setStatus));
        setStatus(`Сравнено: ${scores.length}. Проверяем, есть ли ещё описания…`);
      }
      if (request !== run) return;
      finish();
      if (scores.length === 0) {
        setStatus('В каталоге нет описаний для поиска по изображению.');
        return;
      }
      ranking = scores.sort(bySimilarity);
      diagnostics.hidden = false;
      drawResults();
    } catch (error) {
      if (request !== run) return;
      stopWorker();
      finish();
      console.warn('Ошибка поиска по изображению', error);
      setStatus(error?.message || 'Поиск по изображению недоступен.', true);
    }
  }
  return panel;
}

function scorePage(worker, file, candidates, compared, signal, setStatus) {
  return new Promise((resolve, reject) => {
    const abort = () => finish(reject, signal.reason);
    const finish = (settle, value) => {
      worker.onmessage = worker.onerror = worker.onmessageerror = null;
      signal.removeEventListener('abort', abort);
      settle(value);
    };
    if (signal.aborted) return abort();
    signal.addEventListener('abort', abort, { once: true });
    worker.onmessage = ({ data }) => {
      if (data.status) setStatus(data.status);
      if (data.error) finish(reject, new Error(`Не удалось выполнить поиск CLIP: ${data.error}`));
      else if (data.scores) finish(resolve, data.scores);
    };
    worker.onerror = worker.onmessageerror = () => finish(reject, new Error(
      'Не удалось запустить CLIP. Проверьте, обновлена ли операционная система.',
    ));
    try {
      worker.postMessage({ file, candidates, compared });
    } catch (error) {
      finish(reject, error);
    }
  });
}

function matchRow(entry) {
  const row = document.createElement('li');
  const link = document.createElement('a');
  link.href = `#/indexes/${entry.id}`;
  link.textContent = `Индекс №${entry.id}`;
  const scores = document.createElement('code');
  scores.textContent = `Сходство: ${formatScore(entry.score)} · косинус: ${formatScore(entry.cosine)}`;
  const description = document.createElement('p');
  description.lang = 'en';
  description.textContent = entry.shortDescription;
  row.append(link, scores, description);
  return row;
}
