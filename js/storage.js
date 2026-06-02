// ============================================
// IndexedDB para almacenar fotos (sin límite de localStorage)
// ============================================
const DB_NAME = 'JoseAnahiDB';
const DB_VERSION = 2;
const GALLERY_STORE = 'gallery';
const TIMELINE_STORE = 'timeline';

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(GALLERY_STORE)) {
                const store = db.createObjectStore(GALLERY_STORE, { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
            if (!db.objectStoreNames.contains(TIMELINE_STORE)) {
                const store = db.createObjectStore(TIMELINE_STORE, { keyPath: 'id', autoIncrement: true });
                store.createIndex('month', 'month', { unique: false });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

// ============================================
// Gallery photos
// ============================================
async function getAllGalleryPhotos() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(GALLERY_STORE, 'readonly');
        const store = tx.objectStore(GALLERY_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

async function addGalleryPhoto(blob) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(GALLERY_STORE, 'readwrite');
        const store = tx.objectStore(GALLERY_STORE);
        const req = store.add({ blob, timestamp: Date.now() });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function deleteGalleryPhoto(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(GALLERY_STORE, 'readwrite');
        const store = tx.objectStore(GALLERY_STORE);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function clearGalleryPhotos() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(GALLERY_STORE, 'readwrite');
        const store = tx.objectStore(GALLERY_STORE);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

// ============================================
// Timeline photos
// ============================================
async function getTimelinePhotos(month) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(TIMELINE_STORE, 'readonly');
        const store = tx.objectStore(TIMELINE_STORE);
        const index = store.index('month');
        const req = index.getAll(month);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });
}

async function addTimelinePhoto(month, blob) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(TIMELINE_STORE, 'readwrite');
        const store = tx.objectStore(TIMELINE_STORE);
        const req = store.add({ month, blob, timestamp: Date.now() });
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function deleteTimelinePhoto(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(TIMELINE_STORE, 'readwrite');
        const store = tx.objectStore(TIMELINE_STORE);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

// ============================================
// Export all data (backup)
// ============================================
async function exportAllPhotos() {
    const gallery = await getAllGalleryPhotos();

    // Get all timeline months
    const db = await openDB();
    const allTimeline = await new Promise((resolve, reject) => {
        const tx = db.transaction(TIMELINE_STORE, 'readonly');
        const store = tx.objectStore(TIMELINE_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });

    return { gallery, timeline: allTimeline };
}

// ============================================
// Check storage usage info
// ============================================
async function getStorageInfo() {
    let totalSize = 0;
    let count = 0;

    if (navigator.storage && navigator.storage.estimate) {
        const est = await navigator.storage.estimate();
        totalSize = est.usage || 0;
    }

    const gallery = await getAllGalleryPhotos();
    count = gallery.length;
    const timeline = await (async () => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(TIMELINE_STORE, 'readonly');
            const store = tx.objectStore(TIMELINE_STORE);
            const req = store.count();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    })();

    return {
        totalSize,
        galleryCount: count,
        timelineCount: timeline,
        formattedSize: totalSize > 0
            ? totalSize > 1048576
                ? `${(totalSize / 1048576).toFixed(1)} MB`
                : `${(totalSize / 1024).toFixed(1)} KB`
            : 'Desconocido'
    };
}
