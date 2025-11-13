import { useParams } from "react-router-dom";
import fighters from "../data/fighters";
import { useState } from "react";

export default function FighterDetail() {
  const { id } = useParams();
  const fighter = fighters.find(f => f.id === id);

  const [subscribed, setSubscribed] = useState(false);

  if (!fighter) {
    return <div style={{padding:20}}>Luchador no encontrado.</div>;
  }

  // Registra la suscripción para este luchador (envía al servidor)
  const subscribeToFighter = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push no soportado en este navegador');
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array("BMxAih2OjgfnZ1W-utrcuUNqE04X82HAE-dYEycYJNI5myWjiCgyZZ2Z_dn8FHgoCjhvDsVQpllVX2wxYgvRsqs")
      });

      // Envia la suscripcion + favorito al servidor
      await fetch("http://10.211.114.54:4000/api/subscribe-fighter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription, fighterId: fighter.id })
      });

      setSubscribed(true);
      alert(`Suscrito a ${fighter.name}`);
    } catch (err) {
      console.error("Error al suscribirse:", err);
      alert("Error al suscribirse a las notificaciones.");
    }
  };

  return (
    <div style={{padding:20}}>
      <h2>{fighter.name}</h2>
      <img src={fighter.image} alt={fighter.name} style={{maxWidth:420, width:"100%", borderRadius:8}} />
      <p>{fighter.bio}</p>

      <h4>Logros</h4>
      <ul>
        {fighter.achievements.map((a,i)=> <li key={i}>{a}</li>)}
      </ul>

      <button onClick={subscribeToFighter} disabled={subscribed} style={{marginTop:12}}>
        {subscribed ? "Suscrito" : `Suscribirme a ${fighter.name}`}
      </button>
    </div>
  );
}

// Util (copiado igual que antes)
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}
