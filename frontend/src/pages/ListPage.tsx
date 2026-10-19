import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Spinner, Alert, Badge } from 'react-bootstrap';
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
  const [minCardinality, setMinCardinality] = useState('');
  const [loading, setLoading] = useState(false);

  const loadData = async (filterParams = { search, indexType, minCardinality }) => {
    setLoading(true);
    const data = await fetchIndexes({
      search: filterParams.search,
      indexType: filterParams.indexType,
      minCardinality: filterParams.minCardinality ? Number(filterParams.minCardinality) : undefined,
    });
    setCards(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilterSubmit = () => {
    loadData({ search, indexType, minCardinality });
  };

  const handleFilterReset = () => {
    setSearch('');
    setIndexType('');
    setMinCardinality('');
    loadData({ search: '', indexType: '', minCardinality: '' });
  };

  const handleCardClick = (id: number) => {
    navigate(`${ROUTES.DETAIL}/${id}`);
  };

  return (
    <div className="p-3">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h5 className="fw-bold mb-0">Каталог услуг (Плитка)</h5>
        <Badge bg="secondary">Найдено: {cards.length}</Badge>
      </div>
      <p className="text-muted small mb-3">Оптимизация запросов СУБД PostgreSQL</p>

      {/* Панель фильтрации */}
      <FilterBar
        search={search}
        setSearch={setSearch}
        indexType={indexType}
        setIndexType={setIndexType}
        minCardinality={minCardinality}
        setMinCardinality={setMinCardinality}
        onSubmit={handleFilterSubmit}
        onReset={handleFilterReset}
        loading={loading}
      />

      {loading && (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {!loading && cards.length === 0 && (
        <Alert variant="info" className="text-center">
          По заданным критериям ничего не найдено. Попробуйте сбросить фильтры.
        </Alert>
      )}

      {!loading && (
        <div>
          {cards.map((item) => (
            <IndexCard key={item.id} item={item} onClick={() => handleCardClick(item.id)} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ListPage;
