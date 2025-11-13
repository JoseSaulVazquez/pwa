import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import FighterPage from './pages/FightersPage.jsx';
import AdminPage from './pages/AdminPage.jsx'; 
import FavoritesPage from './pages/FavoritesPage';

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => console.log('Service Worker registrado correctamente'))
      .catch(err => console.error('Error registrando el SW:', err));
  });
}

// IndexedDB inicial
let db = window.indexedDB.open('database');
db.onupgradeneeded = event => {
  let result = event.target.result;
  if (!result.objectStoreNames.contains('table')) {
    result.createObjectStore('table', { autoIncrement: true });
  }
};

// Renderizado principal con rutas
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/fighter/:slug" element={<FighterPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
