import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { ListPage } from './pages/ListPage';
import { FeedPage } from './pages/FeedPage';
import { DetailPage } from './pages/DetailPage';
import { ROUTES } from './Routes';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          {/* Страница 1: Плитка списка услуг с фильтрацией */}
          <Route path={ROUTES.LIST} element={<ListPage />} />
          {/* Страница 2: Лента услуг (Feed) */}
          <Route path={ROUTES.FEED} element={<FeedPage />} />
          {/* Страница 3: Подробнее (Detail) */}
          <Route path={`${ROUTES.DETAIL}/:id`} element={<DetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
