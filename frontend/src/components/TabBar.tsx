import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES, ROUTE_LABELS } from '../Routes';
import { IndexItem } from '../modules/mock';
import './TabBar.css';

interface TabBarProps {
  cards: IndexItem[];
}

export const TabBar: React.FC<TabBarProps> = ({ cards }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isList = location.pathname === ROUTES.LIST;
  const isFeed = location.pathname === ROUTES.FEED || location.pathname.startsWith(ROUTES.DETAIL);

  const goToList = () => navigate(ROUTES.LIST);

  const goToFeed = () => {
    navigate(ROUTES.FEED);
  };

  return (
    <nav className="tabBar">
      {/* 1. Плитка — доступна */}
      <button
        type="button"
        className={`tabBarItem ${isList ? 'tabBarItemActive' : ''}`}
        onClick={goToList}
        title="Плитка каталога услуг"
      >
        <span className="tabBarIcon">▦</span>
        <span>{ROUTE_LABELS.LIST}</span>
      </button>

      {/* 2. Лента — доступна */}
      <button
        type="button"
        className={`tabBarItem ${isFeed ? 'tabBarItemActive' : ''}`}
        onClick={goToFeed}
        title="Лента услуг (Feed)"
      >
        <span className="tabBarIcon">▶</span>
        <span>{ROUTE_LABELS.FEED}</span>
      </button>

      {/* 3. Добавление — недоступно гостю (disabled по ТЗ) */}
      <button
        type="button"
        className="tabBarItem tabBarItemDisabled"
        disabled
        title="Добавление доступно только после авторизации"
      >
        <span className="tabBarIcon">➕</span>
        <span>{ROUTE_LABELS.CREATE}</span>
        <span className="lockBadge">🔒</span>
      </button>

      {/* 4. Вход — недоступен гостю в ЛР5 (disabled по ТЗ) */}
      <button
        type="button"
        className="tabBarItem tabBarItemDisabled"
        disabled
        title="Вход будет реализован в следующей лабораторной работе"
      >
        <span className="tabBarIcon">👤</span>
        <span>{ROUTE_LABELS.LOGIN}</span>
        <span className="lockBadge">🔒</span>
      </button>
    </nav>
  );
};

export default TabBar;
