import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./FavoritesPage.css";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const request = indexedDB.open("database", 2);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("favorites")) {
        db.createObjectStore("favorites", { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("favorites", "readonly");
      const store = tx.objectStore("favorites");
      const getAll = store.getAll();

      getAll.onsuccess = () => {
        setFavorites(getAll.result);
      };
    };
  }, []);

  const removeFavorite = (id) => {
    const request = indexedDB.open("database", 2);

    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("favorites", "readwrite");
      const store = tx.objectStore("favorites");
      store.delete(id);
      tx.oncomplete = () => {
        setFavorites((prev) => prev.filter((f) => f.id !== id));
      };
    };
  };

  return (
    <div className="favorites-container">
      <Link to="/" className="back-link">⬅ Volver</Link>
      <h1 className="title">⭐ Mis Favoritos</h1>

      {favorites.length === 0 ? (
        <p className="no-favs">Aún no tienes luchadores favoritos.</p>
      ) : (
        <div className="favorites-grid">
          {favorites.map((fav) => (
            <div key={fav.id} className="fav-card">
              <img src={`/icons/fighters/${fav.id}.png`} alt={fav.name} />
              <h3>{fav.name}</h3>
              <button onClick={() => removeFavorite(fav.id)}>❌ Eliminar</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
