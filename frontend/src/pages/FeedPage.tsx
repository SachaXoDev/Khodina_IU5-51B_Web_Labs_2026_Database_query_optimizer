import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AppOutletContext } from '../AppLayout';

const defaultImage = '/DefaultImage.jpg';
const defaultVideo = '/DefaultVideo.mp4';

export const FeedPage: React.FC = () => {
  const { cards } = useOutletContext<AppOutletContext>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (currentIndex >= cards.length) {
      setCurrentIndex(0);
    }
    // При переключении карточки сбрасываем раскрытие
    setIsExpanded(false);
  }, [cards.length, currentIndex]);

  const currentItem = cards[currentIndex];

  const handleNext = () => {
    if (!cards.length) return;
    setCurrentIndex((prev) => (prev + 1) % cards.length); // Циклический переход
  };

  const handleLike = () => {
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
      {/* Медиа-слой (видео или обложка) */}
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
            onError={(e) => {
              (e.target as HTMLVideoElement).src = defaultVideo;
            }}
          />
        ) : currentItem.imageUrl ? (
          <img
            className="vibes-video-bg"
            src={currentItem.imageUrl}
            alt={currentItem.indexName}
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultImage;
            }}
          />
        ) : (
          <video
            key="fallback-video"
            className="vibes-video-bg"
            src={defaultVideo}
            autoPlay
            loop
            muted
            playsInline
          />
        )}
        <div className="vibes-gradient-overlay"></div>
      </div>

      {/* Верхний статус-бар Vibes: только бренд с live-dot (без 1/8 по требованию) */}
      <div className="vibes-top-bar">
        <div className="vibes-brand">
          <span className="live-dot"></span>
          <span className="brand-logo-text">DB OPTIMIZER</span>
        </div>
      </div>

      {/* Боковая панель действий и параметров Vibes (справа) - 1-в-1 из ЛР-2 */}
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

        {/* Параметр 1: CARDINALITY (как в ЛР-2) */}
        <div className="vibes-side-metric" title="Мощность индекса (Cardinality)">
          <span className="side-metric-label">CARDINALITY</span>
          <span className="side-metric-val">{currentItem.cardinality}</span>
        </div>

        {/* Параметр 2: ВРЕМЯ (как в ЛР-2) */}
        <div className="vibes-side-metric" title="Оценочное время создания">
          <span className="side-metric-label">ВРЕМЯ</span>
          <span className="side-metric-val">~{currentItem.estimatedCreationTimeSec}s</span>
        </div>
      </div>

      {/* Нижний информационный оверлей Vibes (поверх видео) - 1-в-1 из ЛР-2 */}
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

        {/* Текстовое описание: свернуть / развернуть (больше / меньше) */}
        <div className="vibes-desc-wrapper">
          <p className={`vibes-desc-text ${isExpanded ? 'expanded' : 'collapsed'}`}>
            {currentItem.fullDescription || currentItem.shortDescription}
          </p>

          <button
            type="button"
            className="desc-toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'меньше' : 'больше'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedPage;
