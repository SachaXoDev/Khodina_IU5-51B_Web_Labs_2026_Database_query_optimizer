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
  // Список карточек хранится в общем layout и прокидывается дочерним страницам через Outlet context
  // БЕЗ Redux и БЕЗ React Context по условию лабораторной работы №5
  const [cards, setCards] = useState<IndexItem[]>(MOCK_INDEXES);

  return (
    <div className="phone-screen">
      {/* iOS статус-бар (как в ЛР-1/ЛР-2) */}
      <StatusBar />

      {/* Прокручиваемый контент страницы */}
      <Outlet context={{ cards, setCards }} />

      {/* Фирменная нижняя таб-панель из 4 пунктов */}
      <TabBar />
    </div>
  );
};

export default AppLayout;
