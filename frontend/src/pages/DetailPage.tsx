import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Button, Spinner, Badge } from 'react-bootstrap';
import { IndexItem } from '../modules/mock';
import { fetchIndexById } from '../modules/indexesApi';
import { ROUTES } from '../Routes';
import { AppOutletContext } from '../AppLayout';
import './DetailPage.css';

const defaultImage = '/DefaultImage.jpg';

export const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cards } = useOutletContext<AppOutletContext>();
  const [pageData, setPageData] = useState<IndexItem | null>(null);

  useEffect(() => {
    if (!id) return;

    // Сначала ищем в общем списке cards
    const fromList = cards.find((item) => String(item.id) === id);
    if (fromList) {
      setPageData(fromList);
      return;
    }

    // Если нет в списке (открыли по ссылке) — загружаем
    fetchIndexById(id).then((res) => {
      if (res) setPageData(res);
    });
  }, [id, cards]);

  // Кнопка «Далее» — переход к следующей карточке в текущем списке
  const handleNext = () => {
    if (!id || !cards.length) return;
    const currentIndex = cards.findIndex((item) => String(item.id) === id);
    const nextItem = cards[currentIndex + 1];
    if (nextItem) {
      navigate(`${ROUTES.DETAIL}/${nextItem.id}`);
    } else {
      // Зацикливание на первую
      navigate(`${ROUTES.DETAIL}/${cards[0].id}`);
    }
  };

  if (!pageData) {
    return (
      <div className="detailLoader">
        <Spinner animation="border" variant="light" />
      </div>
    );
  }

  return (
    <div className="detailPage">
      {/* Кнопка возврата к списку */}
      <button
        type="button"
        className="btn btn-sm btn-dark position-absolute top-0 start-0 m-3 z-3 opacity-75"
        onClick={() => navigate(ROUTES.LIST)}
      >
        ⬅️ К списку
      </button>

      {/* Воспроизведение видео при наличии, иначе дефолтное/оригинальное фото */}
      {pageData.videoUrl ? (
        <video
          key={pageData.videoUrl}
          className="detailVideo"
          src={pageData.videoUrl}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
        <img
          className="detailVideo"
          src={pageData.imageUrl || defaultImage}
          alt={pageData.indexName}
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
      )}

      {/* Оверлей страницы Подробнее */}
      <div className="detailOverlay">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <Badge bg="primary">{pageData.indexType}</Badge>
          <Badge bg="info">Строк: {Number(pageData.cardinality).toLocaleString()}</Badge>
        </div>

        <div className="detailTitle">{pageData.indexName}</div>
        <div className="detailArtist">
          Таблица: <code>{pageData.tableName}</code> | Колонка: <code>{pageData.columnName}</code>
        </div>

        <div className="small text-light mt-2 mb-2" style={{ maxHeight: '60px', overflowY: 'auto' }}>
          {pageData.fullDescription || pageData.shortDescription}
        </div>

        <div className="d-flex justify-content-between align-items-center small text-white-50 mb-3">
          <span>Создание: ~{pageData.estimatedCreationTimeSec} сек.</span>
          <span>❤️ {pageData.likesCount}</span>
        </div>

        <Button className="detailNextBtn" variant="light" onClick={handleNext}>
          Далее ➡️
        </Button>
      </div>
    </div>
  );
};

export default DetailPage;
