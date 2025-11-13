import { Link } from "react-router-dom";
import fighters from "./data/fighters";
import "./App.css";

export default function App() {
  return (
    <div className="gallery-container">
      <h1 className="title">WWE WIKI</h1>
      <div className="grid-gallery">
        {fighters.map((w) => (
          <div key={w.id} className="card">
            <Link to={`/fighter/${w.id}`}>
              <img src={w.image} alt={w.name} className="wrestler-img" />
              <h3 className="wrestler-name">{w.name}</h3>
            </Link>
            <Link to="/favorites" className="fav-link">⭐ Ver mis favoritos</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
