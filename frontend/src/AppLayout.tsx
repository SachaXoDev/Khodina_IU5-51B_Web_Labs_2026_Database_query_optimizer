import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { IndexItem, MOCK_INDEXES } from './modules/mock';
import { TabBar } from './components/TabBar';
import './MobileApp.css';

export interface AppOutletContext {
  cards: IndexItem[];
  setCards: React.Dispatch<React.SetStateAction<IndexItem[]>>;
}

export const AppLayout: React.FC = () => {
  // Список карточек хранится в общем layout и прокидывается дочерним страницам через Outlet context
  // БЕЗ Redux и БЕЗ React Context по условию лабораторной работы №5
  const [cards, setCards] = useState<IndexItem[]>(MOCK_INDEXES);

  return (
    <div className="appShell">
      <header className="appHeader d-flex justify-content-between align-items-center">
        <span className="fw-bold" style={{ fontSize: '0.95rem' }}>
          ⚙️ Database Query Optimizer
        </span>
        <span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>
          Гость
        </span>
      </header>

      <main className="appContent">
        <Outlet context={{ cards, setCards }} />
      </main>

      {/* Нижняя таб-панель из 4 пунктов */}
      <TabBar cards={cards} />
    </div>
  );
};

export default AppLayout;
