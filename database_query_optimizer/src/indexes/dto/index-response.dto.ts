export class IndexResponseDto {
  id: number;
  indexName: string;
  shortDescription: string;
  imageFileName: string | null;
  videoFileName: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  tableName: string;
  indexType: string;
  columnName: string;
  cardinality: number;
  fullDescription: string;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  authorId: number | null;
  authorUsername: string | null;
  isOwner: number; // Признак 0/1: создатель услуги совпадает с текущим пользователем
  createdAt: Date;
  publishedAt: Date | null;
}

export class FeedResponseDto {
  current: IndexResponseDto | null;
  prevId: number | null;
  nextId: number | null;
}
