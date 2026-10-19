import { IndexItem, MOCK_INDEXES } from './mock';

export interface FilterParams {
  search?: string;
  indexType?: string;
  minCardinality?: number;
}

// Получение списка с фильтрацией (сначала пробуем веб-сервис, при сбое или отсутствии сети - mock)
export const fetchIndexes = async (filters: FilterParams = {}): Promise<IndexItem[]> => {
  try {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.indexType) params.append('indexType', filters.indexType);
    if (filters.minCardinality) params.append('minCardinality', String(filters.minCardinality));

    const response = await fetch(`/api/indexes?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch {
    // Автономная работа с mock-коллекцией
    let result = [...MOCK_INDEXES];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (x) =>
          x.indexName.toLowerCase().includes(q) ||
          x.tableName.toLowerCase().includes(q) ||
          x.shortDescription.toLowerCase().includes(q)
      );
    }
    if (filters.indexType) {
      result = result.filter((x) => x.indexType === filters.indexType);
    }
    if (filters.minCardinality) {
      result = result.filter((x) => x.cardinality >= Number(filters.minCardinality));
    }
    return result;
  }
};

// Получение элемента по ID (для страницы Подробнее)
export const fetchIndexById = async (id: number | string): Promise<IndexItem | undefined> => {
  try {
    const response = await fetch(`/api/indexes/${id}`);
    if (!response.ok) throw new Error('Not found');
    return await response.json();
  } catch {
    return MOCK_INDEXES.find((item) => String(item.id) === String(id));
  }
};
