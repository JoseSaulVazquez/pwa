const APP_SHELL_CACHE = "appShell_v1.0";
const DYNAMIC_CACHE = "dynamic_v1.0";

const APP_SHELL = ["/", "/index.html", "/manifest.json"];

// ------------------ INSTALACIÓN ------------------
self.addEventListener("install", (event) => {
  console.log("[SW] Instalando...");
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ------------------ ACTIVACIÓN ------------------
self.addEventListener("activate", (event) => {
  console.log("[SW] Activando...");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== APP_SHELL_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ------------------ FETCH ------------------
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    !(event.request.url.startsWith("http://") || event.request.url.startsWith("https://"))
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cacheResp) => {
      if (cacheResp) return cacheResp;

      return fetch(event.request)
        .then((networkResp) => {
          return caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, networkResp.clone());
            return networkResp;
          });
        })
        .catch(() => {
          if (event.request.headers.get("accept")?.includes("text/html")) {
            return caches.match("/index.html");
          }
        });
    })
  );
});

// ------------------ BACKGROUND SYNC ------------------
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-posts") {
    console.log("[SW] Evento sync recibido");
    event.waitUntil(sendSavedPosts());
  }
});

// ------------------ IndexedDB helpers ------------------
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("database", 1);
    request.onupgradeneeded = (event) => {
      let db = event.target.result;
      if (!db.objectStoreNames.contains("table")) {
        db.createObjectStore("table", { autoIncrement: true });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

// ------------------ Reenvío de datos ------------------
async function sendSavedPosts() {
  const db = await openDB();
  const tx = db.transaction("table", "readonly");
  const store = tx.objectStore("table");
  const getReq = store.getAll();

  getReq.onsuccess = async () => {
    const allData = getReq.result;

    if (!allData.length) {
      console.log("[SW] No hay registros pendientes");
      return;
    }

    try {
      for (let item of allData) {
        await fetch("http://localhost:4000/api/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        console.log("Reenviado:", item);
      }

      const clearTx = db.transaction("table", "readwrite");
      clearTx.objectStore("table").clear();
      console.log("[SW] Todos los registros reenviados y limpiados");
    } catch (err) {
      console.error("[SW] Error reenviando:", err);
    }
  };
}

// ------------------ PUSH NOTIFICATIONS ------------------
self.addEventListener("push", (event) => {
  console.log("[SW] Push recibido:", event);

  const data = event.data ? event.data.json() : {};
  const title = data.title || "Notificación PWA";

  // Si viene un luchador en la notificación, personalizamos
  const options = {
    body: data.body || "Nueva actualización disponible.",
    icon: "/icons/icon-512x512.png",
    badge: "/icons/icon-192x192.png",
    data: {
      url: data.url || "/", // Enlace al que redirigir al hacer click
      luchador: data.luchador || null,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ------------------ CLICK EN NOTIFICACIÓN ------------------
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Click en notificación:", event.notification);
  event.notification.close();

  const url = event.notification.data?.url || "/";

  // Intentar abrir o enfocar la ventana de la PWA
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
