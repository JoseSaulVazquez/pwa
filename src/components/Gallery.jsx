import fighters from "../data/fighters";
import "./Gallery.css";

export default function Gallery() {
  return (
    <div className="gallery-container">
      {fighters.map(f => (
        <figure key={f.id} className="card">
          <a
            href={`${window.location.origin}/fighter/${f.id}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`Abrir ${f.name}`}
          >
            <img src={f.image} alt={f.name} className="thumb" />
          </a>
          <figcaption>{f.name}</figcaption>
        </figure>
      ))}
    </div>
  );
}
