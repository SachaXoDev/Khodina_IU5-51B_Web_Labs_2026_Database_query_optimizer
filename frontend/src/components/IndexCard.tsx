import React from 'react';
import { IndexItem } from '../modules/mock';

interface IndexCardProps {
  item: IndexItem;
  onClick: () => void;
  onDelete?: (e: React.MouseEvent) => void;
}

const defaultImage = '/DefaultImage.jpg';

export const IndexCard: React.FC<IndexCardProps> = ({ item, onClick, onDelete }) => {
  const isLiked = item.isLiked === 1;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(e);
    }
  };

  return (
    <div className="tile-card-wrapper">
      {/* Кнопка логического удаления из ЛР-2 (SQL КУРСОР) */}
      <button
        type="button"
        className="tile-delete-btn"
        title="Логически удалить услугу"
        onClick={handleDeleteClick}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* Карточка услуги */}
      <div className="tile-card" onClick={onClick}>
        <div className="tile-image-wrapper">
          <img
            src={item.imageUrl || defaultImage}
            alt={item.indexName}
            className="tile-image"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultImage;
            }}
          />

          {/* Отметка для проверки преподавателем */}
          {!item.imageUrl && (
            <span className="default-badge">default image</span>
          )}

          {/* Бейдж лайков (как в ЛР-2) */}
          <div className={`tile-likes-badge ${isLiked ? 'liked' : 'unliked'}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill={isLiked ? '#1ee46a' : 'none'}
              stroke={isLiked ? '#1ee46a' : 'rgba(255,255,255,0.8)'}
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{item.likesCount}</span>
          </div>
        </div>

        {/* Информационный блок */}
        <div className="tile-info">
          <h3 className="tile-title" title={item.indexName}>
            {item.indexName}
          </h3>
          <span className="tile-subtitle">
            {item.tableName}.{item.columnName}
          </span>
          <span className="tile-time">
            Cardinality: {Number(item.cardinality).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default IndexCard;
