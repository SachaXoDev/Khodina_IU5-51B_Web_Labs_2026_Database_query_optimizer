import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AppOutletContext } from '../AppLayout';

const defaultImage = '/DefaultImage.jpg';

export const FeedPage: React.FC = () => {
  const { cards } = useOutletContext<AppOutletContext>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (currentIndex >= cards.length) {
      setCurrentIndex(0);
    }
  }, [cards.length, currentIndex]);

  const currentItem = cards[currentIndex];

  const handleNext = () => {
    if (!cards.length) return;
    setCurrentIndex((prev) => (prev + 1) % cards.length); // Циклический переход
  };

  const handleLike = () => {
    // Демонстрация интерактивности лайка на клиенте
    if (currentItem) {
      currentItem.isLiked = currentItem.isLiked === 1 ? 0 : 1;
      currentItem.likesCount += currentItem.isLiked === 1 ? 1 : -1;
      setCurrentIndex((p) => p); // триггер рендера
    }
  };

  if (!currentItem) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff' }}>
        Список услуг пуст
      </div>
    );
  }

  const isLiked = currentItem.isLiked === 1;

  return (
    <div className="vibes-feed-container">
      {/* Медиа-слой (видео или картинка с градиентным затемнением) */}
      <div className="vibes-media-layer">
        {currentItem.videoUrl ? (
          <video
            key={currentItem.videoUrl}
            className="vibes-video-bg"
            src={currentItem.videoUrl}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            className="vibes-video-bg"
            src={currentItem.imageUrl || defaultImage}
            alt={currentItem.indexName}
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultImage;
            }}
          />
        )}
        <div className="vibes-gradient-overlay"></div>
      </div>

      {/* Верхний статус-бар Vibes */}
      <div className="vibes-top-bar">
        <div className="vibes-brand">
          <span className="brand-logo-text">DB OPTIMIZER</span>
        </div>
        <div className="vibes-counter">
          {currentIndex + 1} / {cards.length}
        </div>
      </div>

      {/* Боковая панель действий Vibes (справа) */}
      <div className="vibes-sidebar-actions">
        {/* Кнопка лайка */}
        <button className="vibes-action-btn" onClick={handleLike} title="Лайк">
          <div className="action-icon-circle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill={isLiked ? '#1fdc6f' : 'none'}
              stroke={isLiked ? '#1fdc6f' : '#ffffff'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <span className="action-count">{currentItem.likesCount}</span>
        </button>

        {/* Кнопка перехода к следующему индексу (Далее) */}
        <button className="vibes-action-btn" onClick={handleNext} title="Следующий индекс">
          <div className="action-icon-circle next-circle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
          </div>
          <span className="action-count next-label">Далее</span>
        </button>
      </div>

      {/* Нижний информационный оверлей Vibes (поверх видео) */}
      <div className="vibes-bottom-overlay">
        {/* Теги типа индекса и таблицы */}
        <div className="vibes-tags-row">
          <span className="vibes-type-pill">{currentItem.indexType} Index</span>
          <span className="vibes-table-pill">
            {currentItem.tableName}.{currentItem.columnName}
          </span>
        </div>

        {/* Название индекса */}
        <h2 className="vibes-title">{currentItem.indexName}</h2>

        {/* Описание со сворачиванием/разворачиванием "больше / меньше" */}
        <div className="vibes-desc-wrapper">
          <p
            className="vibes-desc-text"
            style={isExpanded ? { WebkitLineClamp: 'unset', maxHeight: '180px', overflowY: 'auto' } : {}}
          >
            {currentItem.fullDescription || currentItem.shortDescription}
          </p>

          <span
            className="desc-toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'меньше' : 'больше'}
          </span>
        </div>

        {/* Метрики производительности (ВРЕМЯ, CARDINALITY, КОЛ-ВО СТРОК) */}
        <div className="vibes-metrics-grid">
          <div className="vibes-metric-card">
            <span className="metric-card-label">ВРЕМЯ СОЗДАНИЯ</span>
            <span className="metric-card-val">~{currentItem.estimatedCreationTimeSec} s</span>
          </div>
          <div className="vibes-metric-card">
            <span className="metric-card-label">CARDINALITY</span>
            <span className="metric-card-val">{currentItem.cardinality}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedPage;
