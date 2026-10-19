import React from 'react';

interface FilterBarProps {
  cardinality: string;
  setCardinality: (val: string) => void;
  onSubmit: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  cardinality,
  setCardinality,
  onSubmit,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardinality(e.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardinality(e.target.value);
  };

  const numValue = cardinality === '' ? 0 : Math.min(5000000, Math.max(0, parseInt(cardinality, 10) || 0));

  return (
    <form onSubmit={handleSubmit} className="filter-cardinality-box">
      {/* Поле ввода Cardinality и кнопка Найти */}
      <div className="search-form-row">
        <div className="search-input-box">
          <input
            type="number"
            id="num-query"
            min="0"
            max="10000000"
            step="1000"
            placeholder="Поиск по cardinality..."
            className="search-input-field"
            value={cardinality}
            onChange={handleInputChange}
          />
        </div>

        <button type="submit" className="btn-search-action">
          Найти
        </button>
      </div>

      {/* Числовой слайдер (ползунок) диапазона Cardinality (как в ЛР-2) */}
      <div className="slider-row">
        <input
          type="range"
          id="slider-query"
          min="0"
          max="5000000"
          step="50000"
          value={numValue}
          className="cardinality-range-slider"
          onChange={handleSliderChange}
        />
        <div className="slider-scale-labels">
          <span>0</span>
          <span>1.5M</span>
          <span>3M</span>
          <span>5M+</span>
        </div>
      </div>
    </form>
  );
};

export default FilterBar;
