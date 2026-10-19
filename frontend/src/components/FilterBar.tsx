import React from 'react';

interface FilterBarProps {
  search: string;
  setSearch: (value: string) => void;
  indexType: string;
  setIndexType: (value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  loading?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  setSearch,
  indexType,
  setIndexType,
  onSubmit,
  onReset,
  loading = false,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="search-form-row">
      {/* Поле поиска по названию/описанию/кардинальности */}
      <div className="search-input-box">
        <input
          type="text"
          className="search-input-field"
          placeholder="Поиск по названию / таблице..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Селект выбора типа индекса */}
      <select
        className="filter-select"
        value={indexType}
        onChange={(e) => setIndexType(e.target.value)}
      >
        <option value="">Все типы</option>
        <option value="B-Tree">B-Tree</option>
        <option value="BRIN">BRIN</option>
        <option value="Hash">Hash</option>
        <option value="GIN">GIN</option>
      </select>

      {/* Кнопка "Найти" в стиле Aiven Green */}
      <button type="submit" className="btn-search-action" disabled={loading}>
        {loading ? '...' : 'Найти'}
      </button>

      {/* Кнопка сброса */}
      {(search || indexType) && (
        <button type="button" className="btn-reset-action" onClick={onReset}>
          ✕
        </button>
      )}
    </form>
  );
};

export default FilterBar;
