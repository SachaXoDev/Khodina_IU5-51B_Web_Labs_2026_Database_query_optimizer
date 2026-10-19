import React from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';

interface FilterBarProps {
  search: string;
  setSearch: (value: string) => void;
  indexType: string;
  setIndexType: (value: string) => void;
  minCardinality: string;
  setMinCardinality: (value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  loading?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  setSearch,
  indexType,
  setIndexType,
  minCardinality,
  setMinCardinality,
  onSubmit,
  onReset,
  loading = false,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Form onSubmit={handleSubmit} className="bg-light p-3 rounded-3 shadow-sm mb-3 border">
      <div className="mb-2">
        <Form.Control
          size="sm"
          type="text"
          placeholder="Поиск по названию или описанию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Row className="g-2 mb-2">
        <Col xs={6}>
          <Form.Select
            size="sm"
            value={indexType}
            onChange={(e) => setIndexType(e.target.value)}
          >
            <option value="">Все типы</option>
            <option value="B-Tree">B-Tree</option>
            <option value="BRIN">BRIN</option>
            <option value="Hash">Hash</option>
            <option value="GIN">GIN</option>
          </Form.Select>
        </Col>

        <Col xs={6}>
          <Form.Control
            size="sm"
            type="number"
            placeholder="Мин. строк"
            value={minCardinality}
            onChange={(e) => setMinCardinality(e.target.value)}
          />
        </Col>
      </Row>

      <div className="d-flex gap-2">
        <Button variant="primary" size="sm" type="submit" className="flex-grow-1" disabled={loading}>
          {loading ? 'Поиск...' : '🔍 Применить'}
        </Button>
        <Button variant="outline-secondary" size="sm" type="button" onClick={onReset} disabled={loading}>
          Сброс
        </Button>
      </div>
    </Form>
  );
};

export default FilterBar;
