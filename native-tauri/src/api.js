import { fetch as nativeFetch } from '@tauri-apps/plugin-http';
import { config } from './config.js';
import { candidatePages } from './clip-ranking.js';

export const { apiOrigin, mediaOrigin } = config(import.meta.env.VITE_API_URL, import.meta.env.VITE_MEDIA_URL);
export const PAGE_SIZE = 12;
const MAX_JSON_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

async function get(url, maxBytes, signal, accept, allowedType) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  if (signal?.aborted) cancel();
  signal?.addEventListener('abort', cancel, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; cancel(); }, 15000);
  try {
    let response;
    try {
      response = await nativeFetch(url, {
        method: 'GET', credentials: 'omit', maxRedirections: 0, connectTimeout: 5000,
        headers: { Accept: accept }, signal: controller.signal,
      });
    } catch (cause) {
      throw new Error('Не удалось подключиться к серверу. Проверьте адрес API и сеть.', { cause });
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`Сервер вернул ошибку HTTP ${response.status}.`);
    }
    const type = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
    if (!type || !allowedType(type) || Number(response.headers.get('content-length')) > maxBytes) {
      await response.body?.cancel();
      throw new Error('Сервер вернул ответ неподдерживаемого формата или размера.');
    }
    if (!response.body) throw new Error('Сервер прислал пустой ответ.');
    const reader = response.body.getReader();
    const chunks = [];
    let length = 0;
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > maxBytes) throw new Error('Ответ сервера слишком большой.');
        chunks.push(value);
      }
    } catch (error) {
      await reader.cancel().catch(() => {});
      throw new Error('Не удалось прочитать ответ сервера или превышен допустимый размер.', { cause: error });
    } finally {
      reader.releaseLock();
    }
    return new Blob(chunks, { type });
  } catch (error) {
    if (timedOut) throw new Error('Сервер не ответил вовремя. Проверьте подключение к сети.');
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}

async function json(path, signal) {
  const data = await get(new URL(path, apiOrigin), MAX_JSON_BYTES, signal, 'application/json', (type) => type === 'application/json');
  try {
    return JSON.parse(await data.text());
  } catch (cause) {
    throw new Error('Не удалось прочитать данные каталога.', { cause });
  }
}

export async function catalog({ search, indexType, minCardinality, offset }, signal) {
  const q = new URLSearchParams({ limit: PAGE_SIZE, offset });
  if (search) q.set('search', search);
  if (indexType) q.set('indexType', indexType);
  if (minCardinality !== '') q.set('minCardinality', minCardinality);
  const page = await json(`/api/indexes?${q}`, signal);
  if (!Array.isArray(page?.items) || page.items.length > PAGE_SIZE || !page.items.every(validItem) ||
      !Number.isSafeInteger(page.total) || page.total < 0 || page.offset !== offset || page.limit !== PAGE_SIZE) {
    throw new Error('Сервер вернул некорректную страницу каталога.');
  }
  return page;
}

export async function detail(id, signal) {
  const item = await json(`/api/indexes/${id}`, signal);
  if (!validItem(item) || item.id !== id) throw new Error('Сервер вернул некорректную карточку индекса.');
  return item;
}

export function candidates(signal) {
  return candidatePages((afterId, limit) => {
    const q = new URLSearchParams({ afterId, limit });
    return json(`/api/indexes/clip-candidates?${q}`, signal);
  });
}

function validItem(item) {
  return Number.isSafeInteger(item?.id) && item.id > 0 && typeof item.indexName === 'string';
}

export function thumbnail(source, signal) {
  const url = new URL(source, apiOrigin);
  if (![apiOrigin, mediaOrigin].includes(url.origin) || url.username || url.password || !/^\/(media|assets)\//.test(url.pathname)) {
    throw new Error('Thumbnail is outside the configured LAN media scope.');
  }
  return get(url, MAX_IMAGE_BYTES, signal, 'image/*', (type) => /^image\/(jpeg|png|webp|gif|svg\+xml|avif)$/.test(type));
}
