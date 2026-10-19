import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Button, Badge } from 'react-bootstrap';
import { AppOutletContext } from '../AppLayout';
import './DetailPage.css';

const defaultImage = '/DefaultImage.jpg';

export const FeedPage: React.FC = () => {
  const { cards } = useOutletContext<AppOutletContext>();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Сброс индекса если список изменился
    if (currentIndex >= cards.length) {
      setCurrentIndex(0);
    }
  }, [cards.length, currentIndex]);

  const currentItem = cards[currentIndex];

  const handleNext = () => {
    if (!cards.length) return;
    setCurrentIndex((prev) => (prev + 1) % cards.length); // Циклический переход вперед
  };

  const handlePrev = () => {
    if (!cards.length) return;
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length); // Циклический переход назад
  };

  if (!currentItem) {
    return (
      <div className="detailLoader">
        <p className="text-white">Список услуг пуст</p>
      </div>
    );
  }

  return (
    <div className="detailPage">
      {/* Воспроизведение видео при наличии, иначе дефолтное/оригинальное изображение */}
      {currentItem.videoUrl ? (
        <video
          key={currentItem.videoUrl}
          className="detailVideo"
          src={currentItem.videoUrl}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
        <img
          className="detailVideo"
          src={currentItem.imageUrl || defaultImage}
          alt={currentItem.indexName}
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
      )}

      {/* Оверлей ленты (вертикальный TikTok-формат) */}
      <div className="detailOverlay">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <Badge bg="primary">{currentItem.indexType}</Badge>
          <span className="small text-white-50">
            {currentIndex + 1} из {cards.length}
          </span>
        </div>

        <div className="detailTitle">{currentItem.indexName}</div>
        <div className="detailArtist">
          Таблица: <code>{currentItem.tableName}</code> ({currentItem.columnName})
        </div>

        <p className="small text-light mt-2 mb-3 opacity-75">
          {currentItem.shortDescription}
        </p>

        <div className="d-flex gap-2">
          <Button variant="outline-light" className="w-50" onClick={handlePrev}>
            ⬅️ Предыдущая
          </Button>
          <Button variant="light" className="w-50" onClick={handleNext}>
            Следующая ➡️
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeedPage;
