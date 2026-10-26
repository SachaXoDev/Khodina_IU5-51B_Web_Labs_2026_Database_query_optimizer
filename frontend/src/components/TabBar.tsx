import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES, ROUTE_LABELS } from '../Routes';

export const TabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isList = location.pathname === ROUTES.LIST;
  const isFeed = location.pathname === ROUTES.FEED || location.pathname.startsWith(ROUTES.DETAIL);

  return (
    <nav className="mobile-tabbar">
      {/* 1. Лента — доступна (переход на /feed) */}
      <button
        type="button"
        className={`tab-item ${isFeed ? 'active' : ''}`}
        onClick={() => navigate(ROUTES.FEED)}
        title="Лента услуг (Vibes/Reels)"
      >
        <div className="tab-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </div>
        <span className="tab-label">{ROUTE_LABELS.FEED}</span>
      </button>

      {/* 2. Добавление — недоступно гостю (disabled по ТЗ) */}
      <button
        type="button"
        className="tab-item disabled"
        disabled
        title="Добавление доступно только после авторизации"
      >
        <div className="tab-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </div>
        <span className="tab-label">
          {ROUTE_LABELS.CREATE}
        </span>
      </button>

      {/* 3. Плитка — доступна (переход на /) */}
      <button
        type="button"
        className={`tab-item ${isList ? 'active' : ''}`}
        onClick={() => navigate(ROUTES.LIST)}
        title="Плитка каталога услуг"
      >
        <div className="tab-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </div>
        <span className="tab-label">{ROUTE_LABELS.LIST}</span>
      </button>

      {/* 4. Вход — недоступен гостю (disabled по ТЗ) */}
      <button
        type="button"
        className="tab-item disabled"
        disabled
        title="Вход будет реализован в следующей лабораторной работе"
      >
        <div className="tab-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <span className="tab-label">
          {ROUTE_LABELS.LOGIN}
        </span>
      </button>
    </nav>
  );
};

export default TabBar;
