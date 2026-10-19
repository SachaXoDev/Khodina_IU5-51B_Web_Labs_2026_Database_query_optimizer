import React from 'react';
import { Card, Badge } from 'react-bootstrap';
import { IndexItem } from '../modules/mock';

interface IndexCardProps {
  item: IndexItem;
  onClick: () => void;
}

const defaultImage = '/DefaultImage.jpg';

export const IndexCard: React.FC<IndexCardProps> = ({ item, onClick }) => {
  return (
    <Card
      className="shadow-sm border-0 mb-3 overflow-hidden"
      style={{ cursor: 'pointer', transition: 'transform 0.15s ease-in-out' }}
      onClick={onClick}
    >
      <div style={{ height: '170px', overflow: 'hidden', position: 'relative', background: '#0f172a' }}>
        <Card.Img
          variant="top"
          src={item.imageUrl || defaultImage}
          alt={item.indexName}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
        <Badge
          bg="primary"
          className="position-absolute top-0 end-0 m-2 px-2 py-1 shadow-sm"
          style={{ fontSize: '0.8rem' }}
        >
          {item.indexType}
        </Badge>
        {!item.imageUrl && (
          <Badge
            bg="dark"
            className="position-absolute bottom-0 start-0 m-2 px-2 py-1 shadow-sm opacity-75"
            style={{ fontSize: '0.7rem' }}
          >
            Изображение по умолчанию
          </Badge>
        )}
      </div>

      <Card.Body className="p-3">
        <Card.Title className="fs-6 fw-bold text-primary mb-1 text-truncate">
          {item.indexName}
        </Card.Title>
        <Card.Subtitle className="mb-2 text-muted" style={{ fontSize: '0.75rem' }}>
          Таблица: <code>{item.tableName}</code> | Колонка: <code>{item.columnName}</code>
        </Card.Subtitle>

        <Card.Text className="text-secondary small mb-2" style={{ maxHeight: '38px', overflow: 'hidden' }}>
          {item.shortDescription}
        </Card.Text>

        <div className="d-flex justify-content-between align-items-center pt-2 border-top small text-muted">
          <span>Строк: <strong>{Number(item.cardinality).toLocaleString()}</strong></span>
          <span>❤️ {item.likesCount}</span>
        </div>
      </Card.Body>
    </Card>
  );
};

export default IndexCard;
