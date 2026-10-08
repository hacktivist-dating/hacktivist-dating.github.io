/* localStorage wrapper + tiny IndexedDB key/value store (used for uploaded avatars & covers). */
(function () {
  const HD = window.HD; const S = HD.storage = { images: {} };
  S.get = (k, d = null) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  S.set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  S.remove = k => { try { localStorage.removeItem(k); } catch (e) { } };
  let db = null;
  S.initIDB = () => new Promise(res => {
    if (!window.indexedDB) return res(false);
    try {
      const rq = indexedDB.open('hd-media', 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore('kv');
      rq.onerror = () => res(false);
      rq.onsuccess = () => {
        db = rq.result;
        try {
          const tx = db.transaction('kv').objectStore('kv'), keys = tx.getAllKeys(), vals = tx.getAll();
          vals.onsuccess = () => { keys.result.forEach((k, i) => S.images[k] = vals.result[i]); res(true); };
          vals.onerror = () => res(false);
        } catch (e) { res(false); }
      };
    } catch (e) { res(false); }
  });
  S.putImage = (key, dataUrl) => { S.images[key] = dataUrl; if (!db) return Promise.resolve(false); return new Promise(res => { try { const tx = db.transaction('kv', 'readwrite'); tx.objectStore('kv').put(dataUrl, key); tx.oncomplete = () => res(true); tx.onerror = tx.onabort = () => res(false); } catch (e) { res(false); } }); };
  S.delImage = key => { delete S.images[key]; if (!db) return; try { db.transaction('kv', 'readwrite').objectStore('kv').delete(key); } catch (e) { } };
  S.clearImages = () => { S.images = {}; if (!db) return; try { db.transaction('kv', 'readwrite').objectStore('kv').clear(); } catch (e) { } };
})();
