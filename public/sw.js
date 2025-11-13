const APP_SHELL_CACHE = "appShell_v2.0";
const DYNAMIC_CACHE = "dynamic_v2.0";
const APP_SHELL = ["/", "/index.html", "/manifest.json"];

/* ---------------- INSTALACIÓN ---------------- */
self.addEventListener("install", (event) => {
  console.log("[SW] Instalando...");
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

/* ---------------- ACTIVACIÓN ---------------- */
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

/* ---------------- FETCH ---------------- */
self.addEventListener("fetch", (event) => {
  if (
    event.request.method !== "GET" ||
    !(event.request.url.startsWith("http://") || event.request.url.startsWith("https://"))
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => cache.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match("/index.html")))
  );
});

/* ---------------- BACKGROUND SYNC ---------------- */
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-comments") {
    console.log("[SW] ⏳ Sincronizando comentarios pendientes...");
    event.waitUntil(syncOfflineComments());
  }
});

/* ---------------- FUNC: Sincronizar Comentarios Offline ---------------- */
async function syncOfflineComments() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("database", 4);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("comments")) {
        db.createObjectStore("comments", { autoIncrement: true });
      }
    };

    request.onsuccess = async (event) => {
      const db = event.target.result;
      const tx = db.transaction("comments", "readwrite");
      const store = tx.objectStore("comments");
      const getAll = store.getAll();

      getAll.onsuccess = async () => {
        const comments = getAll.result;
        if (!comments.length) {
          console.log("[SW] No hay comentarios pendientes ✅");
          resolve();
          return;
        }

        for (const comment of comments) {
          try {
            await fetch("https://apispwa.onrender.com/api/comments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(comment),
            });
            console.log("✅ Comentario sincronizado:", comment);
          } catch (err) {
            console.error("❌ Error enviando comentario:", err);
            reject(err);
            return;
          }
        }

        // Limpia comentarios enviados
        const clearTx = db.transaction("comments", "readwrite");
        clearTx.objectStore("comments").clear();
        clearTx.oncomplete = () => {
          console.log("[SW] 🧹 Comentarios offline eliminados tras sincronizar.");
          resolve();
        };
      };
    };

    request.onerror = (err) => {
      console.error("[SW] Error al abrir IndexedDB:", err);
      reject(err);
    };
  });
}

/* ---------------- PUSH NOTIFICATIONS ---------------- */
self.addEventListener("push", (event) => {
  console.log("[SW] Push recibido:", event);
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Notificación PWA";

  const options = {
    body: data.body || "Nueva actualización disponible.",
    icon: "/icons/icon-512x512.png",
    badge: "/icons/icon-192x192.png",
    data: {
      url: data.url || "/",
      luchador: data.luchador || null,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/* ---------------- CLICK EN NOTIFICACIÓN ---------------- */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
