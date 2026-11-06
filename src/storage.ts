import type { Save } from "./game/state";
let database: Promise<IDBDatabase> | undefined;
function open(): Promise<IDBDatabase> {
  return (database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open("botak-academy", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("saves");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      database = undefined;
      reject(request.error);
    };
  }));
}
export async function loadSave(): Promise<unknown> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("saves", "readonly"),
      request = tx.objectStore("saves").get("current");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function storeSave(save: Save): Promise<void> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("saves", "readwrite");
    tx.objectStore("saves").put(save, "current");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
