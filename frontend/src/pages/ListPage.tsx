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

  // Локальные состояния фильтров
  const [search, setSearch] = useState('');
  const [indexType, setIndexType] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async (filterParams = { search, indexType }) => {
    setLoading(true);
    const data = await fetchIndexes({
      search: filterParams.search,
      indexType: filterParams.indexType,
    });
    setCards(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilterSubmit = () => {
    loadData({ search, indexType });
  };

  const handleFilterReset = () => {
    setSearch('');
    setIndexType('');
    loadData({ search: '', indexType: '' });
  };

  const handleCardClick = (id: number) => {
    navigate(`${ROUTES.DETAIL}/${id}`);
  };

  return (
    <>
      {/* Шапка экрана каталога (как в ЛР-1/ЛР-2) */}
      <header className="mobile-header">
        <div className="header-logo-group">
          <span className="brand-logo-text">DB OPTIMIZER</span>
          <span className="header-pipe">|</span>
          <span className="service-name">B-tree Catalog</span>
        </div>
        <span className="guest-badge">Гость</span>
      </header>

      {/* Основной скроллируемый контент */}
      <main className="page-scrollable">
        <div className="content-padding">
          {/* Поиск и фильтрация */}
          <FilterBar
            search={search}
            setSearch={setSearch}
            indexType={indexType}
            setIndexType={setIndexType}
            onSubmit={handleFilterSubmit}
            onReset={handleFilterReset}
            loading={loading}
          />

          {/* Плитка в 2 столбца (Pixel Perfect ЛР-1 / ЛР-2) */}
          <div className="index-grid-2col">
            {cards.map((item) => (
              <IndexCard
                key={item.id}
                item={item}
                onClick={() => handleCardClick(item.id)}
              />
            ))}
          </div>

          {!loading && cards.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#8c93a0', gridColumn: 'span 2' }}>
              <p>Индексы по запросу не найдены.</p>
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#1fdc6f', textDecoration: 'underline', cursor: 'pointer' }}
                onClick={handleFilterReset}
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
