import { IndexItem, MOCK_INDEXES } from './mock';

export interface FilterParams {
  search?: string;
  indexType?: string;
  minCardinality?: number;
}

// Получение списка с фильтрацией (в ЛР-5 работаем с mock-коллекцией в локальном state)
export const fetchIndexes = async (filters: FilterParams = {}): Promise<IndexItem[]> => {
  // Имитация асинхронного вызова API для ЛР-5
  await new Promise((resolve) => setTimeout(resolve, 50));

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
  if (filters.minCardinality !== undefined && !isNaN(filters.minCardinality)) {
    result = result.filter((x) => x.cardinality === Number(filters.minCardinality));
  }
  return result;
};

// Получение элемента по ID (для страницы Подробнее)
export const fetchIndexById = async (id: number | string): Promise<IndexItem | undefined> => {
  await new Promise((resolve) => setTimeout(resolve, 30));
  return MOCK_INDEXES.find((item) => String(item.id) === String(id));
};
