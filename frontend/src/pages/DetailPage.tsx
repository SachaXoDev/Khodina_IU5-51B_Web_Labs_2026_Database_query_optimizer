import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { IndexItem } from '../modules/mock';
import { fetchIndexById } from '../modules/indexesApi';
import { ROUTES } from '../Routes';
import { AppOutletContext } from '../AppLayout';

const defaultImage = '/DefaultImage.jpg';

export const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cards } = useOutletContext<AppOutletContext>();
  const [pageData, setPageData] = useState<IndexItem | null>(null);

  useEffect(() => {
    if (!id) return;
    const fromList = cards.find((item) => String(item.id) === id);
    if (fromList) {
      setPageData(fromList);
      return;
    }
    fetchIndexById(id).then((res) => {
      if (res) setPageData(res);
    });
  }, [id, cards]);

  const handleNext = () => {
    if (!id || !cards.length) return;
    const currentIndex = cards.findIndex((item) => String(item.id) === id);
    const nextItem = cards[currentIndex + 1];
    if (nextItem) {
      navigate(`${ROUTES.DETAIL}/${nextItem.id}`);
    } else {
      navigate(`${ROUTES.DETAIL}/${cards[0].id}`);
    }
  };

  if (!pageData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff' }}>
        Загрузка...
      </div>
    );
  }

  const isLiked = pageData.isLiked === 1;

  return (
    <div className="vibes-feed-container">
      {/* Кнопка "Назад к плитке" */}
      <button
        type="button"
        style={{
          position: 'absolute',
          top: '14px',
          left: '14px',
          zIndex: 10,
          background: 'rgba(13, 14, 16, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          cursor: 'pointer',
        }}
        onClick={() => navigate(ROUTES.LIST)}
      >
        ✕ Закрыть
      </button>

      {/* Медиа-слой */}
      <div className="vibes-media-layer">
        {pageData.videoUrl ? (
          <video
            key={pageData.videoUrl}
            className="vibes-video-bg"
            src={pageData.videoUrl}
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            className="vibes-video-bg"
            src={pageData.imageUrl || defaultImage}
            alt={pageData.indexName}
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultImage;
            }}
          />
        )}
        <div className="vibes-gradient-overlay"></div>
      </div>

      {/* Боковая панель */}
      <div className="vibes-sidebar-actions">
        <div className="vibes-action-btn">
          <div className="action-icon-circle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill={isLiked ? '#1ee46a' : 'none'}
              stroke={isLiked ? '#1ee46a' : '#ffffff'}
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <span className="action-count">{pageData.likesCount}</span>
        </div>

        <button className="vibes-action-btn" onClick={handleNext} title="Далее">
          <div className="action-icon-circle next-circle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
          </div>
          <span className="action-count next-label">Далее</span>
        </button>
      </div>

      {/* Оверлей снизу */}
      <div className="vibes-bottom-overlay">
        <div className="vibes-tags-row">
          <span className="vibes-type-pill">{pageData.indexType} Index</span>
          <span className="vibes-table-pill">
            {pageData.tableName}.{pageData.columnName}
          </span>
        </div>

        <h2 className="vibes-title">{pageData.indexName}</h2>

        <p className="vibes-desc-text" style={{ WebkitLineClamp: 'unset', maxHeight: '120px', overflowY: 'auto' }}>
          {pageData.fullDescription || pageData.shortDescription}
        </p>

        <div className="vibes-metrics-grid">
          <div className="vibes-metric-card">
            <span className="metric-card-label">ВРЕМЯ</span>
            <span className="metric-card-val">~{pageData.estimatedCreationTimeSec} s</span>
          </div>
          <div className="vibes-metric-card">
            <span className="metric-card-label">CARDINALITY</span>
            <span className="metric-card-val">{Number(pageData.cardinality).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPage;
