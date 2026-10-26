import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { IndexCard } from '../components/IndexCard';
import { FilterBar } from '../components/FilterBar';
import { fetchIndexes } from '../modules/indexesApi';
import { ROUTES } from '../Routes';
import { AppOutletContext } from '../AppLayout';

export const ListPage: React.FC = () => {
  const navigate = useNavigate();
  const { cards, setCards } = useOutletContext<AppOutletContext>();

  // Локальное состояние фильтра Cardinality (точно как в ЛР-2)
  const [cardinality, setCardinality] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async (queryVal = cardinality) => {
    setLoading(true);
    const data = await fetchIndexes({
      minCardinality: queryVal ? Number(queryVal) : undefined,
    });
    setCards(data);
    setLoading(false);
  };

  // Если карточек нет (например, первый рендер), инициализируем их
  useEffect(() => {
    if (cards.length === 0) {
      loadData();
    }
  }, []);

  const handleFilterSubmit = () => {
    loadData(cardinality);
  };

  const handleResetFilter = () => {
    setCardinality('');
    loadData('');
  };

  const handleCardClick = (id: number) => {
    navigate(`${ROUTES.FEED}?id=${id}`);
  };

  const handleLikeToggle = (id: number) => {
    setCards((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextIsLiked = item.isLiked === 1 ? 0 : 1;
          const nextLikes = item.likesCount + (nextIsLiked === 1 ? 1 : -1);
          return { ...item, isLiked: nextIsLiked, likesCount: nextLikes };
        }
        return item;
      })
    );
  };

  const handleDeleteCard = (id: number, name: string) => {
    if (confirm(`Логически удалить услугу "${name}"?`)) {
      setCards((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <>
      {/* Шапка экрана (1-в-1 из ЛР-2) */}
      <header className="mobile-header">
        <div className="header-logo-group">
          <span className="brand-logo-text">DB OPTIMIZER</span>
          <span className="header-pipe">|</span>
          <span className="service-name">B-tree Catalog</span>
        </div>
      </header>

      {/* Основной контент каталога */}
      <main className="page-scrollable">
        <div className="content-padding">
          {/* Фильтрация / Поиск по Cardinality со слайдером (как в ЛР-2) */}
          <FilterBar
            cardinality={cardinality}
            setCardinality={setCardinality}
            onSubmit={handleFilterSubmit}
          />

          {/* Плитка в 2 столбца (как в ЛР-2) */}
          <div className="index-grid-2col">
            {cards.map((item) => (
              <IndexCard
                key={item.id}
                item={item}
                onClick={() => handleCardClick(item.id)}
                onDelete={() => handleDeleteCard(item.id, item.indexName)}
                onLikeToggle={() => handleLikeToggle(item.id)}
              />
            ))}
          </div>

          {!loading && cards.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#8c93a0', gridColumn: 'span 2' }}>
              <p>Опубликованные индексы по запросу не найдены.</p>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#1fdc6f', textDecoration: 'underline', cursor: 'pointer' }}
                onClick={handleResetFilter}
              >
                Сбросить фильтр
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default ListPage;
