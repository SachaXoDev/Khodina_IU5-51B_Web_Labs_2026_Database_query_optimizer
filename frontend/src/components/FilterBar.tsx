import React from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

interface FilterBarProps {
  cardinality: string;
  setCardinality: (val: string) => void;
  onSubmit: (val?: string) => void;
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
    const val = e.target.value;
    setCardinality(val);
    onSubmit(val);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardinality(e.target.value);
  };

  const numValue = cardinality === '' ? 0 : Math.min(5000000, Math.max(0, parseInt(cardinality, 10) || 0));

  return (
    <Form onSubmit={handleSubmit} className="filter-cardinality-box">
      {/* Поле ввода Cardinality и кнопка Найти с использованием React-Bootstrap Form и Button */}
      <div className="search-form-row">
        <div className="search-input-box">
          <Form.Control
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

        <Button type="submit" className="btn-search-action">
          Найти
        </Button>
      </div>

      {/* Числовой слайдер диапазона Cardinality (React-Bootstrap Form.Range) */}
      <div className="slider-row">
        <Form.Range
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
    </Form>
  );
};

export default FilterBar;

