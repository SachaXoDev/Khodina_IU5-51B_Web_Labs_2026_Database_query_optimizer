import { env, RawImage } from '@huggingface/transformers';
import ortModule from '../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.mjs?url';
import ortBinary from '../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.wasm?url';
import { loadClip } from './clip-model.js';
import { scoreEntries } from './clip-ranking.js';

// Tauri's webview is not cross-origin isolated. SIMD + one WASM thread works
// without SharedArrayBuffer; the outer worker keeps inference out of the UI.
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.proxy = false;
env.backends.onnx.wasm.wasmPaths = { mjs: new URL(ortModule, self.location.href).href, wasm: new URL(ortBinary, self.location.href).href };
let clip;
let imageVector;
const textCache = new Map();
const MAX_CACHED_CAPTIONS = 1024;

self.onmessage = async ({ data: { file, candidates, compared } }) => {
  const status = (message) => self.postMessage({ status: message });
  let failure = 'Не удалось сравнить изображение с описаниями.';
  try {
    let image;
    if (file) {
      if (!self.OffscreenCanvas || !self.createImageBitmap) {
        self.postMessage({ error: 'Для поиска по фото нужен обновлённый системный веб-компонент.' });
        return;
      }
      let bitmap;
      try {
        bitmap = await createImageBitmap(file);
      } catch {
        self.postMessage({ error: 'Не удалось прочитать изображение. Попробуйте другой файл PNG, JPEG или WebP.' });
        return;
      }
      try {
        if (bitmap.width * bitmap.height > 16_000_000) {
          self.postMessage({ error: 'Разрешение изображения не должно превышать 16 мегапикселей.' });
          return;
        }
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        canvas.getContext('2d').drawImage(bitmap, 0, 0);
        image = RawImage.fromCanvas(canvas);
      } finally {
        bitmap.close();
      }
    }
    if (!clip) {
      const bundled = import.meta.env.VITE_BUNDLE_CLIP === '1';
      failure = bundled ? 'Не удалось загрузить встроенную модель.' : 'Не удалось загрузить модель. Проверьте подключение к интернету.';
      status(bundled ? 'Загрузка встроенной модели CLIP…' : 'Загрузка модели CLIP (около 154 МБ при первом запуске)…');
      let lastProgress = 0;
      clip = await loadClip('wasm', (item) => {
        if (item.status === 'progress' && item.file.endsWith('.onnx') && performance.now() - lastProgress > 150) {
          lastProgress = performance.now();
          const part = item.file.includes('text_model') ? 'для текста' : 'для изображений';
          status(`Загрузка модели ${part} · ${Math.round(item.progress)}%`);
        }
      });
    }
    if (image) {
      failure = 'Не удалось обработать изображение.';
      status('Анализ изображения на устройстве…');
      imageVector = await clip.embedImage(image);
    }
    failure = 'Не удалось сравнить изображение с описаниями.';
    const captions = candidates.map((entry) => entry.shortDescription);
    const available = new Map();
    const missing = new Set();
    for (const caption of captions) {
      if (textCache.has(caption)) {
        const vector = textCache.get(caption);
        textCache.delete(caption);
        textCache.set(caption, vector);
        available.set(caption, vector);
      } else {
        missing.add(caption);
      }
    }
    const uncached = [...missing];
    const embedded = await clip.embedText(uncached, (count) => status(
      `Сравнено: ${compared}. Новые описания на странице: ${count} из ${uncached.length}…`,
    ));
    for (const [i, caption] of uncached.entries()) {
      textCache.set(caption, embedded[i]);
      available.set(caption, embedded[i]);
    }
    while (textCache.size > MAX_CACHED_CAPTIONS) textCache.delete(textCache.keys().next().value);
    self.postMessage({ scores: scoreEntries(imageVector, candidates, captions.map((caption) => available.get(caption))) });
  } catch (error) {
    console.warn('Ошибка обработки CLIP', error);
    self.postMessage({ error: failure });
  }
};
