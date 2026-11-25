export const CANDIDATE_PAGE_SIZE = 100;
const MAX_ID = 2_147_483_647;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const DEFAULT_THRESHOLD = 0.65;
export const MIN_THRESHOLD = 0.40;
export const MAX_THRESHOLD = 0.90;
export const MAX_TOP_K = 20;

export function validateCandidatePage(page, afterId) {
  const { items, nextAfterId } = page ?? {};
  if (!Array.isArray(items) || items.length > CANDIDATE_PAGE_SIZE) {
    throw new Error(`Сервер должен вернуть страницу из не более чем ${CANDIDATE_PAGE_SIZE} кандидатов.`);
  }
  let lastId = afterId;
  const entries = items.map((entry) => {
    const { id, shortDescription } = entry ?? {};
    const caption = typeof shortDescription === 'string' ? shortDescription.trim() : '';
    const length = [...caption].length;
    if (!Number.isInteger(id) || id <= lastId || id > MAX_ID || length < 50 || length > 100) {
      throw new Error('Неверный порядок, ID или длина описания кандидата (нужно 50–100 символов).');
    }
    lastId = id;
    return { id, shortDescription: caption };
  });
  if (nextAfterId !== null && (items.length !== CANDIDATE_PAGE_SIZE || nextAfterId !== lastId || lastId === MAX_ID)) {
    throw new Error('Сервер вернул неверный курсор кандидатов.');
  }
  return { items: entries, nextAfterId };
}

export async function* candidatePages(fetchPage) {
  let afterId = 0;
  do {
    const { items, nextAfterId } = validateCandidatePage(await fetchPage(afterId, CANDIDATE_PAGE_SIZE), afterId);
    if (items.length) yield items;
    afterId = nextAfterId;
  } while (afterId !== null);
}

export function l2normalize(vector) {
  const norm = Math.hypot(...vector);
  if (!Number.isFinite(norm) || norm === 0) throw new Error('CLIP returned an invalid embedding.');
  return Float32Array.from(vector, (value) => value / norm);
}

export function scoreEntries(image, entries, textVectors) {
  return entries.map((entry, row) => {
    const text = textVectors[row];
    if (text.length !== image.length) throw new Error('CLIP text and image dimensions do not match.');
    let dot = 0;
    for (let i = 0; i < image.length; i++) dot += image[i] * text[i];
    const cosine = Math.max(-1, Math.min(1, dot));
    return { ...entry, cosine, score: (cosine + 1) / 2 };
  });
}

export function bySimilarity(a, b) {
  return b.cosine - a.cosine || a.id - b.id;
}

export function selectMatches(ranking, threshold, topK) {
  return ranking.filter(({ score }) => score >= threshold).slice(0, topK);
}
