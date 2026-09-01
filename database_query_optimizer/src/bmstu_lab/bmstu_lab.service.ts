import { Injectable } from '@nestjs/common';

export type ServiceStatus = 'draft' | 'published' | 'deleted';

export interface DatabaseIndexOptimization {
  id: number;
  status: ServiceStatus;
  tableName: string;
  indexName: string;
  indexedColumn: string;
  indexType: string;
  totalRows: number;
  cardinality: number;
  selectivity: number;
  avgQueryTimeMs: number;
  description: string;
  querySnippet?: string;
  imageKey: string;
  videoKey: string;
  userLikes: number[];
}

@Injectable()
export class BmstuLabService {
  private readonly minioBaseUrl = 'http://localhost:9000/media';
  public readonly currentUserId = 101; // ID текущего авторизованного пользователя

  private optimizations: DatabaseIndexOptimization[] = [
    {
      id: 1,
      status: 'published',
      tableName: 'users',
      indexName: 'idx_users_email',
      indexedColumn: 'email',
      indexType: 'B-tree',
      totalRows: 1200000,
      cardinality: 1180000,
      selectivity: 98.3,
      avgQueryTimeMs: 0.28,
      description: 'Высокоэффективная оптимизация поиска пользователей по точному совпадению и префиксу email. Позволяет полностью исключить тяжелое последовательное сканирование (Seq Scan) таблицы при авторизации и валидации учетных записей. Значительно снижает нагрузку на дисковую подсистему и процессор при пиковом трафике.',
      querySnippet: 'SELECT * FROM users WHERE email = $1;',
      imageKey: 'index_users_email.jpg',
      videoKey: 'index_users_email.mp4',
      userLikes: [101, 102, 105, 108, 112],
    },
    {
      id: 2,
      status: 'published',
      tableName: 'orders',
      indexName: 'idx_orders_status',
      indexedColumn: 'status',
      indexType: 'B-tree',
      totalRows: 4500000,
      cardinality: 3200000,
      selectivity: 71.1,
      avgQueryTimeMs: 0.35,
      description: 'B-tree индекс по статусу оформления заказов в интернет-магазине. Оптимизирует выборки для очередей обработки и формирования оперативных отчетов складской логистики. Ускоряет фильтрацию заказов в статусах processing и pending.',
      querySnippet: 'SELECT * FROM orders WHERE status = $1;',
      imageKey: 'index_orders_created_at.jpg',
      videoKey: 'index_orders_created_at.mp4',
      userLikes: [101, 103, 104, 105, 106],
    },
    {
      id: 3,
      status: 'published',
      tableName: 'metrics',
      indexName: 'idx_perf_metrics',
      indexedColumn: 'created_at',
      indexType: 'B-tree',
      totalRows: 850000,
      cardinality: 845000,
      selectivity: 99.4,
      avgQueryTimeMs: 1.08,
      description: 'Индекс по временным меткам создания метрик производительности. Обеспечивает мгновенный доступ к временным рядам и данным мониторинга за последние сутки без полного перебора партиций.',
      querySnippet: 'SELECT * FROM metrics WHERE created_at >= $1;',
      imageKey: 'index_products_sku.jpg',
      videoKey: 'index_products_sku.mp4',
      userLikes: [102, 104, 107, 109, 110],
    },
    {
      id: 4,
      status: 'published',
      tableName: 'system_logs',
      indexName: 'idx_logs_level',
      indexedColumn: 'level',
      indexType: 'B-tree',
      totalRows: 15000000,
      cardinality: 9500000,
      selectivity: 63.3,
      avgQueryTimeMs: 1.23,
      description: 'Индекс по уровню логирования системы (ERROR, WARN, INFO, DEBUG). Критически важен для быстрого поиска сбоев и критических ошибок в высоконагруженных микросервисных кластерах.',
      querySnippet: 'SELECT * FROM system_logs WHERE level = $1;',
      imageKey: 'index_logs_timestamp.jpg',
      videoKey: 'index_logs_timestamp.mp4',
      userLikes: [101, 102, 103, 104, 106],
    },
    {
      id: 5,
      status: 'draft', // Единственный черновик в коллекции для экрана создания
      tableName: 'users',
      indexName: 'idx_users_email',
      indexedColumn: 'email',
      indexType: 'B-tree',
      totalRows: 1250000,
      cardinality: 1250000,
      selectivity: 99.0,
      avgQueryTimeMs: 0.28,
      description: 'Оптимизация поиска по email, исключение Seq Scan',
      querySnippet: 'SELECT * FROM table WHERE column = $1;',
      imageKey: 'index_users_email.jpg',
      videoKey: 'index_users_email.mp4',
      userLikes: [],
    },
    {
      id: 6,
      status: 'deleted', // Удаленная услуга (никогда не отображается в интерфейсе)
      tableName: 'temp_archive',
      indexName: 'idx_temp_archive_old',
      indexedColumn: 'deleted_at',
      indexType: 'B-tree',
      totalRows: 50000,
      cardinality: 45000,
      selectivity: 90.0,
      avgQueryTimeMs: 9.99,
      description: 'Удаленный тестовый индекс.',
      querySnippet: 'SELECT * FROM temp_archive;',
      imageKey: 'index_logs_timestamp.jpg',
      videoKey: 'index_logs_timestamp.mp4',
      userLikes: [],
    },
  ];

  private enrichOptimization(item: DatabaseIndexOptimization) {
    const isLikedByMe = item.userLikes.includes(this.currentUserId);
    return {
      ...item,
      likesCount: item.userLikes.length,
      isLikedByMe,
      imageUrl: `${this.minioBaseUrl}/${item.imageKey}`,
      videoUrl: `${this.minioBaseUrl}/${item.videoKey}`,
      formattedTotalRows: item.totalRows.toLocaleString('ru-RU'),
      formattedCardinality: item.cardinality.toLocaleString('ru-RU'),
    };
  }

  toggleLike(id: number) {
    const item = this.optimizations.find((s) => s.id === id);
    if (!item) return null;

    const userIndex = item.userLikes.indexOf(this.currentUserId);
    if (userIndex === -1) {
      // Поставить лайк
      item.userLikes.push(this.currentUserId);
    } else {
      // Убрать лайк
      item.userLikes.splice(userIndex, 1);
    }
    return this.enrichOptimization(item);
  }

  getDraftOptimization() {
    const draft = this.optimizations.find((s) => s.status === 'draft');
    return draft ? this.enrichOptimization(draft) : null;
  }

  getPublishedOptimizations(searchQuery?: string) {
    let list = this.optimizations.filter((s) => s.status === 'published');
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase().replace(',', '.');
      const num = parseFloat(q);

      list = list.filter((s) => {
        const timeStr = s.avgQueryTimeMs.toString().toLowerCase();
        const timeFull = `${s.avgQueryTimeMs} ms`.toLowerCase();
        const timeFullRu = `${s.avgQueryTimeMs} мс`.toLowerCase();
        
        // Поиск по текстовому вхождению времени (например "0.28", "0.28 ms", "0.28 мс")
        if (timeStr.includes(q) || timeFull.includes(q) || timeFullRu.includes(q)) {
          return true;
        }

        // Поиск по числовому значению (с погрешностью)
        if (!isNaN(num)) {
          return Math.abs(s.avgQueryTimeMs - num) < 0.05;
        }

        return false;
      });
    }
    return list.map((item) => this.enrichOptimization(item));
  }

  getFeedItem(id?: number, next?: boolean) {
    const published = this.optimizations.filter((s) => s.status === 'published');
    if (published.length === 0) return null;

    let currentIndex = 0;
    if (id !== undefined && !isNaN(id)) {
      const foundIdx = published.findIndex((s) => s.id === id);
      if (foundIdx !== -1) {
        currentIndex = foundIdx;
      }
    }

    if (next) {
      currentIndex = (currentIndex + 1) % published.length;
    }

    const currentItem = published[currentIndex];
    const nextItem = published[(currentIndex + 1) % published.length];

    return {
      current: this.enrichOptimization(currentItem),
      nextId: nextItem.id,
    };
  }

  createOptimization(data: Partial<DatabaseIndexOptimization>) {
    const newId = this.optimizations.length > 0 ? Math.max(...this.optimizations.map(s => s.id)) + 1 : 1;
    const item: DatabaseIndexOptimization = {
      id: newId,
      status: 'published',
      tableName: data.tableName || 'new_table',
      indexName: data.indexName || `idx_${data.tableName || 'table'}_${data.indexedColumn || 'col'}`,
      indexedColumn: data.indexedColumn || 'id',
      indexType: data.indexType || 'B-tree',
      totalRows: Number(data.totalRows) || 100000,
      cardinality: Number(data.cardinality) || 95000,
      selectivity: Number(data.selectivity) || 95.0,
      avgQueryTimeMs: Number(data.avgQueryTimeMs) || 1.0,
      description: data.description || 'Новый созданный индекс.',
      querySnippet: data.querySnippet || 'SELECT * FROM table;',
      imageKey: 'index_users_email.jpg',
      videoKey: 'index_users_email.mp4',
      userLikes: [],
    };
    this.optimizations.unshift(item);
    return this.enrichOptimization(item);
  }
}
