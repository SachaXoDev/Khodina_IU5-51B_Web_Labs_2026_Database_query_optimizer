import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { IndexItem, MOCK_INDEXES } from './modules/mock';
import { TabBar } from './components/TabBar';
import { StatusBar } from './components/StatusBar';
import './style.css';

export interface AppOutletContext {
  cards: IndexItem[];
  setCards: React.Dispatch<React.SetStateAction<IndexItem[]>>;
}

export const AppLayout: React.FC = () => {
  // БЕЗ Redux и БЕЗ React Context
  const [cards, setCards] = useState<IndexItem[]>(MOCK_INDEXES);

  return (
    <div className="phone-screen">
      {/* Прокручиваемый контент страницы */}
      <Outlet context={{ cards, setCards }} />

      {/* Фирменная нижняя таб-панель из 4 пунктов */}
      <TabBar />
    </div>
  );
};

export default AppLayout;
