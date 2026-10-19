import React from 'react';
import { IndexItem } from '../modules/mock';

interface IndexCardProps {
  item: IndexItem;
  onClick: () => void;
}

const defaultImage = '/DefaultImage.jpg';

export const IndexCard: React.FC<IndexCardProps> = ({ item, onClick }) => {
  const isLiked = item.isLiked === 1;

  return (
    <div className="tile-card" onClick={onClick}>
      {/* Изображение услуги или дефолтная заглушка */}
      <div className="tile-image-wrapper">
        <img
          src={item.imageUrl || defaultImage}
          alt={item.indexName}
          className="tile-image"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />

        {/* Бейдж дефолтного изображения для проверки преподавателем */}
        {!item.imageUrl && (
          <span className="default-badge">default image</span>
        )}

        {/* Лайки карточки (зеленое сердце если лайкнуто, как в ЛР-1/ЛР-2) */}
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

      {/* Информационный блок плитки */}
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
  );
};

export default IndexCard;
