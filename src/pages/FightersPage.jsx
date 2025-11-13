import { useParams, Link } from "react-router-dom";
import fighters from "../data/fighters";
import { useEffect } from "react";
import "./FightersPage.css";

export default function FighterPage() {
  const { slug } = useParams();
  const fighter = fighters.find((f) => f.id === slug);

  if (!fighter) return <p style={{ color: "white" }}>Luchador no encontrado.</p>;

  // ✅ Inicializar IndexedDB
  useEffect(() => {
    const request = indexedDB.open("database", 4);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("favorites"))
        db.createObjectStore("favorites", { keyPath: "id" });
      if (!db.objectStoreNames.contains("comments"))
        db.createObjectStore("comments", { autoIncrement: true });
    };
  }, []);

  // ⭐ Guardar favorito
  const saveFavorite = () => {
    const request = indexedDB.open("database", 4);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction("favorites", "readwrite");
      tx.objectStore("favorites").put({ id: fighter.id, name: fighter.name });
      tx.oncomplete = () => alert(`⭐ ${fighter.name} agregado a favoritos`);
    };
  };

  // 🔔 SUSCRIPCIÓN PUSH
  const subscribeToFighter = async () => {
    const sw = await navigator.serviceWorker.ready;
    const subscription = await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey:
        "BIFfnwJktLiHzU4hsToHUkjNoPia0L4XuEcIyt3m3PeTHxo9oCSKdgNSWeIP2RS37p5ulxnP0Twzt86hLt8PQuQ",
    });

    await fetch("https://apispwa.onrender.com/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription, luchador: fighter.name }),
    });

    alert(`🔔 Te suscribiste a ${fighter.name}`);
  };

  // 🔕 CANCELAR SUSCRIPCIÓN
  const unsubscribe = async () => {
    const sw = await navigator.serviceWorker.ready;
    const sub = await sw.pushManager.getSubscription();
    if (!sub) return alert("No estás suscrito");

    await fetch("https://apispwa.onrender.com/api/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    });

    await sub.unsubscribe();
    alert(`🔕 Cancelaste suscripción a ${fighter.name}`);
  };

  // 💬 Cargar comentarios
  async function loadComments() {
    const list = document.getElementById("comment-list");
    list.innerHTML = "";

    // Online → Mongo
    if (navigator.onLine) {
      const res = await fetch(`https://apispwa.onrender.com/api/comments/${fighter.id}`);
      const data = await res.json();
      data.forEach((c) => {
        const li = document.createElement("li");
        li.textContent = `${c.name}: ${c.comment}`;
        list.appendChild(li);
      });
    }

    // Offline → IndexedDB
    const dbReq = indexedDB.open("database", 4);
    dbReq.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction("comments", "readonly");
      const store = tx.objectStore("comments");
      const getAll = store.getAll();
      getAll.onsuccess = () => {
        getAll.result
          .filter((c) => c.fighterId === fighter.id)
          .forEach((c) => {
            const li = document.createElement("li");
            li.textContent = `${c.name} (offline): ${c.comment}`;
            li.style.opacity = "0.6";
            list.appendChild(li);
          });
      };
    };
  }

  useEffect(() => {
    loadComments();
  }, []);

  // ✍️ Enviar comentario
  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = e.target.name.value || "Anónimo";
    const comment = e.target.comment.value.trim();
    if (!comment) return;

    const commentData = { fighterId: fighter.id, name, comment };

    if (navigator.onLine) {
      await fetch("https://apispwa.onrender.com/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentData),
      });
      alert("💬 Comentario enviado!");
    } else {
      const dbReq = indexedDB.open("database", 4);
      dbReq.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("comments"))
          db.createObjectStore("comments", { autoIncrement: true });
      };
      dbReq.onsuccess = (event) => {
        const db = event.target.result;
        const tx = db.transaction("comments", "readwrite");
        tx.objectStore("comments").add(commentData);
        tx.oncomplete = () => {
          alert("📦 Comentario guardado offline (se enviará luego)");
          navigator.serviceWorker.ready.then((reg) => {
            reg.sync.register("sync-comments");
          });
        };
      };
    }

    e.target.reset();
    loadComments();
  };

  return (
    <div className="fighter-wrapper">
      <div className="fighter-container">
        <Link to="/" className="back-link">⬅ Volver</Link>
        <h1 className="fighter-name">{fighter.name}</h1>
        <img src={fighter.image} alt={fighter.name} className="fighter-img" />
        <p className="bio">{fighter.bio}</p>

        <h3>🏆 Logros destacados:</h3>
        <ul className="achievements">
          {fighter.achievements.map((a, i) => <li key={i}>{a}</li>)}
        </ul>

        <button className="subscribe-btn" onClick={subscribeToFighter}>🔔 Suscribirme</button>
        <button className="unsubscribe-btn" onClick={unsubscribe}>🔕 Cancelar suscripción</button>
        <button className="fav-btn" onClick={saveFavorite}>⭐ Agregar a favoritos</button>

        <h3>💬 Comentarios</h3>
        <form onSubmit={handleSubmit}>
          <input type="text" name="name" placeholder="Tu nombre" />
          <textarea name="comment" placeholder="Escribe un comentario..." required />
          <button type="submit">💭 Enviar comentario</button>
        </form>
        <ul id="comment-list" className="comments-list"></ul>
      </div>

      <div className="fighter-bg" style={{ backgroundImage: `url(${fighter.image2})` }} />
    </div>
  );
}
