// db.js
export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("database", 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("table")) {
        db.createObjectStore("table", { autoIncrement: true });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function addData(data) {
  const db = await openDB();
  const tx = db.transaction("table", "readwrite");
  const store = tx.objectStore("table");
  store.add(data);
  console.log("Guardado en IndexedDB:", data);
  return tx.complete;
}
