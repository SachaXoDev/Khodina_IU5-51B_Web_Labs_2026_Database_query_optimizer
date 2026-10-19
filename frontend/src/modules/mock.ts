export interface IndexItem {
  id: number;
  indexName: string;
  tableName: string;
  indexType: string;
  columnName: string;
  cardinality: number;
  estimatedCreationTimeSec: number;
  shortDescription: string;
  fullDescription: string;
  status: string;
  likesCount: number;
  isLiked: number;
  imageUrl?: string;
  videoUrl?: string;
  authorUsername?: string;
  createdAt: string;
}

export const MOCK_INDEXES: IndexItem[] = [
  {
    id: 1,
    indexName: 'idx_orders_customer_id',
    tableName: 'orders',
    indexType: 'B-Tree',
    columnName: 'customer_id',
    cardinality: 10000,
    estimatedCreationTimeSec: 3,
    shortDescription: 'Ускорение выборки истории заказов конкретного покупателя',
    fullDescription: 'B-Tree индекс по внешнему ключу customer_id устраняет Sequential Scan при запросах истории покупок пользователя и сокращает Execution Time с 480 мс до 1.2 мс.',
    status: 'published',
    likesCount: 14,
    isLiked: 0,
    // Локальные медиа-файлы из проекта (грузятся моментально и оффлайн)
    imageUrl: '/media/index_orders_created_at.jpg',
    videoUrl: '/media/index_orders_created_at.mp4',
    authorUsername: 'db_architect',
    createdAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 2,
    indexName: 'idx_audit_logs_created_at_brin',
    tableName: 'audit_logs',
    indexType: 'BRIN',
    columnName: 'created_at',
    cardinality: 5000000,
    estimatedCreationTimeSec: 8,
    shortDescription: 'BRIN индекс для хронологических логов аудита безопасности',
    fullDescription: 'Block Range Index (BRIN) сжимает индекс в 15 раз по сравнению со стандартным B-Tree, группируя смежные страницы диска по временным меткам логов.',
    status: 'published',
    likesCount: 29,
    isLiked: 1,
    imageUrl: '/media/index_logs_timestamp.jpg',
    videoUrl: '/media/index_logs_timestamp.mp4',
    authorUsername: 'sysadmin',
    createdAt: '2026-03-02T14:30:00.000Z',
  },
  {
    id: 3,
    indexName: 'idx_users_email_hash',
    tableName: 'users',
    indexType: 'Hash',
    columnName: 'email',
    cardinality: 150000,
    estimatedCreationTimeSec: 2,
    shortDescription: 'Hash индекс для мгновенной точечной аутентификации по email',
    fullDescription: 'Хеш-индекс обеспечивает константную сложность поиска O(1) для операторов точного равенства при входе пользователей в систему.',
    status: 'published',
    likesCount: 9,
    isLiked: 0,
    // Специально оставляем пустым для демонстрации DefaultImage.jpg (Скриншоты 4-5)
    imageUrl: '',
    videoUrl: '/media/index_users_email.mp4',
    authorUsername: 'sec_engineer',
    createdAt: '2026-03-03T09:15:00.000Z',
  },
  {
    id: 4,
    indexName: 'idx_products_tags_gin',
    tableName: 'products',
    indexType: 'GIN',
    columnName: 'tags',
    cardinality: 85000,
    estimatedCreationTimeSec: 6,
    shortDescription: 'GIN индекс для полнотекстовой фильтрации массивов тегов',
    fullDescription: 'Generalized Inverted Index индексирует каждый элемент массива тегов, ускоряя поиск с пересечением @> в каталоге интернет-магазина.',
    status: 'published',
    likesCount: 37,
    isLiked: 1,
    // Специально пустое изображение и видео для демонстрации DefaultImage.jpg и DefaultVideo.mp4
    imageUrl: '',
    videoUrl: '',
    authorUsername: 'lead_dev',
    createdAt: '2026-03-04T18:00:00.000Z',
  },
];
