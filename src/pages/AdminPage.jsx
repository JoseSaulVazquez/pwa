import { useState } from "react";
import "./AdminPage.css";

export default function AdminPage() {
  // Credenciales de acceso (puedes cambiarlas)
  const ADMIN_USER = "admin";
  const ADMIN_PASS = "1234";

  const [isLogged, setIsLogged] = useState(false);
  const [form, setForm] = useState({ user: "", pass: "" });
  const [selected, setSelected] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");

  const luchadores = [
    "CM Punk",
    "John Cena",
    "Undertaker",
    "Edge",
    "Jeff Hardy",
    "Randy Orton",
  ];

  //LOGIN 
  const handleLogin = (e) => {
    e.preventDefault();
    if (form.user === ADMIN_USER && form.pass === ADMIN_PASS) {
      setIsLogged(true);
    } else {
      alert("Usuario o contraseña incorrectos");
    }
  };

  //ENVIAR NOTIFICACIÓN
  const sendNotification = async () => {
    if (!selected || !title || !body) {
      alert("Completa todos los campos antes de enviar.");
      return;
    }

    try {
      const response = await fetch(`http://10.211.114.54:4000/api/send-push/${encodeURIComponent(selected)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });

      const data = await response.json();
      setMessage(data.message || "Notificación enviada con éxito");
    } catch (err) {
      console.error(err);
      setMessage("Error al enviar la notificación");
    }
  };

  //INTERFAZ LOGIN
  if (!isLogged) {
    return (
      <div className="admin-login">
        <h1>🔒 Panel de Administración</h1>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Usuario"
            value={form.user}
            onChange={(e) => setForm({ ...form, user: e.target.value })}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={form.pass}
            onChange={(e) => setForm({ ...form, pass: e.target.value })}
          />
          <button type="submit">Entrar</button>
        </form>
      </div>
    );
  }

  //INTERFAZ PRINCIPAL
  return (
    <div className="admin-container">
      <h1>Enviar notificación</h1>

      <label>Luchador:</label>
      <select value={selected} onChange={(e) => setSelected(e.target.value)}>
        <option value="">-- Selecciona un luchador --</option>
        {luchadores.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>

      <label>Título:</label>
      <input
        type="text"
        placeholder=""
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label>Mensaje:</label>
      <textarea
        placeholder=""
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <button onClick={sendNotification}>Enviar notificación</button>

      {message && <p className="status-msg">{message}</p>}
    </div>
  );
}
