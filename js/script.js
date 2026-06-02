// ============================================
// Configuración
// ============================================
const CONFIG = {
    startDate: new Date('2026-02-27T00:00:00'),
    herName: 'Anahí',
    hisName: 'Jose'
};

// ============================================
// Scroll reveal animations
// ============================================
function initRevealAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.section').forEach(s => observer.observe(s));
}

initRevealAnimations();

// ============================================
// Theme Toggle
// ============================================
function toggleTheme() {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    document.getElementById('themeCheckbox').checked = isLight;
}

function loadTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
        document.body.classList.add('light');
        document.getElementById('themeCheckbox').checked = true;
    }
}

loadTheme();

// ============================================
// Navbar
// ============================================
function toggleNav() {
    document.getElementById('navLinks').classList.toggle('show');
}

function closeNav() {
    document.getElementById('navLinks').classList.remove('show');
}

// ============================================
// Contador
// ============================================
function updateCounter() {
    const now = new Date();
    const diff = now - CONFIG.startDate;
    if (diff < 0) return;

    const totalSeconds = Math.floor(diff / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);

    // Calcular meses exactos por calendario (cada 27 = 1 mes)
    const start = CONFIG.startDate;
    let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    let days = now.getDate() - start.getDate();

    if (days < 0) {
        months--;
        const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        days = prevMonth.getDate() + days;
    }

    document.getElementById('months').textContent = months;
    document.getElementById('days').textContent = days;
    document.getElementById('hours').textContent = String(totalHours % 24).padStart(2, '0');
    document.getElementById('minutes').textContent = String(totalMinutes % 60).padStart(2, '0');
    document.getElementById('seconds').textContent = String(totalSeconds % 60).padStart(2, '0');
}

updateCounter();
setInterval(updateCounter, 1000);

// ============================================
// Timeline interactiva (IndexedDB)
// ============================================
let timelineCache = {};
let timelineNotes = JSON.parse(localStorage.getItem('timelineNotes')) || {};

function saveTimelineNotes() {
    localStorage.setItem('timelineNotes', JSON.stringify(timelineNotes));
}

async function loadTimelinePhotos() {
    const all = await (async () => {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction('timeline', 'readonly');
            const store = tx.objectStore('timeline');
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    })();

    timelineCache = {};
    all.forEach(item => {
        if (!timelineCache[item.month]) timelineCache[item.month] = [];
        timelineCache[item.month].push(item);
    });
}

async function renderTimeline() {
    await loadTimelinePhotos();
    const now = new Date();
    const start = new Date(CONFIG.startDate);
    const totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const container = document.getElementById('timeline');
    if (!container) return;

    const firstItem = container.querySelector('.timeline-item:first-child');
    container.innerHTML = '';
    if (firstItem) container.appendChild(firstItem);

    const monthsToShow = Math.min(totalMonths, 12);
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    for (let i = 1; i <= monthsToShow; i++) {
        const d = new Date(start);
        d.setMonth(d.getMonth() + i);
        const monthName = monthNames[d.getMonth()];
        const key = i;
        const media = timelineCache[key] || [];

        const item = document.createElement('div');
        item.className = 'timeline-item';
        const photosHtml = media.map(item => {
            const url = URL.createObjectURL(item.blob);
            return `<div style="position:relative;display:inline-block;">
                <img src="${url}" alt="Mes ${key}" onclick="viewTLPhoto(${item.id})" />
                <button onclick="event.stopPropagation();deleteTLPhoto(${item.id})" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,0.7);color:#fff;border:none;border-radius:50%;width:22px;height:22px;font-size:12px;cursor:pointer;line-height:22px;text-align:center;padding:0;">✕</button>
            </div>`;
        }).join('');

        item.innerHTML = `
            <div class="timeline-date">${monthName}</div>
            <div class="timeline-content">
                <h3>Mes ${i}</h3>
                <p>${timelineNotes[key] || getMemoryMessage(i)}</p>
                <div class="timeline-photos">${photosHtml}</div>
                <button class="btn-small" onclick="addTLPhoto(${i})">📷 Agregar foto</button>
                <button class="btn-small" onclick="editTLNote(${i})" style="border-color:var(--text-muted);color:var(--text-muted);margin-left:0.3rem;">✏️ Nota</button>
            </div>
        `;
        container.appendChild(item);
    }

    const placeholder = document.createElement('div');
    placeholder.className = 'timeline-item';
    placeholder.innerHTML = `
        <div class="timeline-date">...</div>
        <div class="timeline-content">
            <h3>Muchos más meses</h3>
            <p>Esta historia aún no termina. Mes a mes, te sigo eligiendo.</p>
        </div>
    `;
    container.appendChild(placeholder);
}

function getMemoryMessage(month) {
    const msgs = [
        'Un mes de descubrir tu sonrisa. El primero de muchos.',
        'Dos meses y sigo sin creer lo afortunado que soy.',
        'Tres meses. Cada día contigo es mejor que el anterior.',
        'Cuatro meses. Ya no imagino mi vida sin ti.',
        'Cinco meses. Tu risa es mi sonido favorito.',
        'Seis meses. Medio año de pura felicidad.',
        'Siete meses. Sigues siendo mi pensamiento favorito.',
        'Ocho meses. Contigo el tiempo vuela.',
        'Nueve meses. Cada día te amo más.',
        'Diez meses. Eres mi persona favorita.',
        'Once meses. Ya casi un año de cuentos de hadas.',
        'Doce meses. Un año junto a ti. El mejor año de mi vida.'
    ];
    return msgs[month - 1] || `Mes ${month}. Seguimos sumando momentos hermosos.`;
}

function addTLPhoto(month) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        await addTimelinePhoto(month, file);
        renderTimeline();
        updateStorageInfo();
    };
    input.click();
}

async function deleteTLPhoto(id) {
    await deleteTimelinePhoto(id);
    renderTimeline();
    updateStorageInfo();
}

async function viewTLPhoto(id) {
    const db = await openDB();
    const tx = db.transaction('timeline', 'readonly');
    const store = tx.objectStore('timeline');
    const item = await new Promise(r => { const req = store.get(id); req.onsuccess = () => r(req.result); });
    if (item) {
        const url = URL.createObjectURL(item.blob);
        document.getElementById('modal-title').textContent = 'Momento especial';
        document.getElementById('modal-body').innerHTML = `<img src="${url}" style="width:100%;border-radius:12px;" />`;
        document.getElementById('letter-modal').classList.add('show');
    }
}

function editTLNote(month) {
    const note = prompt('Escribí un recuerdo para este mes:', timelineNotes[month] || '');
    if (note !== null) {
        timelineNotes[month] = note;
        saveTimelineNotes();
        renderTimeline();
        updateStorageInfo();
    }
}

async function migrateOldTimelinePhotos() {
    const old = JSON.parse(localStorage.getItem('timelineMedia')) || {};
    for (const [key, arr] of Object.entries(old)) {
        const month = parseInt(key.replace('month_', ''));
        if (isNaN(month)) continue;
        if (arr.note) { timelineNotes[month] = arr.note; }
        for (const dataUrl of arr) {
            if (dataUrl === arr.note || dataUrl.startsWith('http')) continue;
            try {
                const resp = await fetch(dataUrl);
                const blob = await resp.blob();
                await addTimelinePhoto(month, blob);
            } catch (e) { /* skip */ }
        }
    }
    saveTimelineNotes();
    localStorage.removeItem('timelineMedia');
}

renderTimeline();
migrateOldTimelinePhotos();

// ============================================
// Galería (IndexedDB — sin límite de espacio)
// ============================================
let galleryPhotos = [];

async function loadGallery() {
    galleryPhotos = await getAllGalleryPhotos();
    renderGallery();
    if (typeof startCarousel === 'function') startCarousel();
}

function renderGallery() {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    gallery.innerHTML = galleryPhotos.map((item, i) => {
        const url = URL.createObjectURL(item.blob);
        return `<div class="gallery-img">
            <img src="${url}" alt="Foto ${i + 1}" />
            <button class="delete-photo" onclick="deletePhoto(${item.id}, this)">✕</button>
        </div>`;
    }).join('');
}

async function deletePhoto(id, btn) {
    await deleteGalleryPhoto(id);
    btn.closest('.gallery-img').remove();
    galleryPhotos = await getAllGalleryPhotos();
    updateStorageInfo();
    if (typeof startCarousel === 'function') startCarousel();
}

async function handleFiles(files) {
    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        await addGalleryPhoto(file);
    }
    galleryPhotos = await getAllGalleryPhotos();
    renderGallery();
    updateStorageInfo();
    if (typeof startCarousel === 'function') startCarousel();
}

function setupGalleryUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    if (!uploadArea) return;

    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        fileInput.value = '';
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });
}

// Si hay fotos viejas en localStorage, migrarlas a IndexedDB
async function migrateOldPhotos() {
    const old = JSON.parse(localStorage.getItem('photos')) || [];
    if (old.length === 0) return;
    for (const dataUrl of old) {
        const resp = await fetch(dataUrl);
        const blob = await resp.blob();
        await addGalleryPhoto(blob);
    }
    localStorage.removeItem('photos');
    galleryPhotos = await getAllGalleryPhotos();
    renderGallery();
}

loadGallery();
setupGalleryUpload();
migrateOldPhotos();

// ============================================
// Mapa - Múltiples markers
// ============================================
let map;
let markers = JSON.parse(localStorage.getItem('mapMarkers')) || [];
renderMarkerList();

function initMap() {
    map = L.map('map', {
        center: markers.length > 0 ? [markers[0].lat, markers[0].lng] : [-34.6037, -58.3816],
        zoom: 13,
        zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19
    }).addTo(map);

    markers.forEach(m => addMarkerToMap(m));

    map.on('click', (e) => {
        const name = prompt('Nombre de este lugar:');
        if (name && name.trim()) {
            const markerData = { lat: e.latlng.lat, lng: e.latlng.lng, name: name.trim() };
            markers.push(markerData);
            saveMarkers();
            addMarkerToMap(markerData);
            renderMarkerList();
        }
    });
}

function addMarkerToMap(markerData) {
    const m = L.marker([markerData.lat, markerData.lng], { draggable: true }).addTo(map);
    m.bindPopup(`<b>${markerData.name}</b>`).openPopup();

    m.on('dragend', () => {
        const pos = m.getLatLng();
        const idx = markers.findIndex(mk => mk.name === markerData.name && mk.lat === markerData.lat && mk.lng === markerData.lng);
        if (idx !== -1) {
            markers[idx].lat = pos.lat;
            markers[idx].lng = pos.lng;
            saveMarkers();
        }
    });
}

function searchLocation() {
    const query = document.getElementById('map-search').value.trim();
    if (!query) return;

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
        .then(r => r.json())
        .then(data => {
            if (data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const markerData = { lat: parseFloat(lat), lng: parseFloat(lon), name: query };
                markers.push(markerData);
                saveMarkers();
                addMarkerToMap(markerData);
                renderMarkerList();
                map.setView([parseFloat(lat), parseFloat(lon)], 14);
                document.getElementById('map-search').value = '';
            } else {
                alert('No se encontró el lugar.');
            }
        })
        .catch(() => alert('Error al buscar.'));
}

function renderMarkerList() {
    const list = document.getElementById('mapMarkersList');
    if (!list) return;
    list.innerHTML = markers.map((m, i) => `
        <span class="map-marker-tag" onclick="flyToMarker(${i})">
            📍 ${m.name}
            <button class="remove-marker" onclick="event.stopPropagation(); deleteMarker(${i})">✕</button>
        </span>
    `).join('');
}

function flyToMarker(index) {
    const m = markers[index];
    if (m) map.setView([m.lat, m.lng], 15);
}

function deleteMarker(index) {
    markers.splice(index, 1);
    saveMarkers();
    renderMarkerList();
    initMap();
}

initMap();
renderMarkerList();

// ============================================
// Playlist
// ============================================
function getTracks(artist) {
    return JSON.parse(localStorage.getItem(`tracks_${artist}`)) || [];
}

function saveTracks(artist, tracks) {
    localStorage.setItem(`tracks_${artist}`, JSON.stringify(tracks));
}

function renderTracks(artist) {
    const tracks = getTracks(artist);
    const container = document.getElementById(`tracks-${artist}`);
    if (!container) return;

    container.innerHTML = tracks.map((t, i) => `
        <div class="spotify-track">
            <span class="track-num">${i + 1}</span>
            <span class="track-title">${t.title || t.url}</span>
            <button class="play-btn" onclick="window.open('${t.url}','_blank')">▶</button>
            <button class="track-delete" onclick="deleteTrack('${artist}', ${i})">✕</button>
        </div>
    `).join('');
}

function addArtistSong(artist, ev) {
    const card = ev.target.closest('.spotify-card');
    const input = card.querySelector('.spotify-input');
    const url = input.value.trim();
    if (!url) return;

    const tracks = getTracks(artist);
    const title = url.includes('youtube') || url.includes('youtu.be') ? '🎬 YouTube' :
                  url.includes('spotify') ? '🎧 Spotify' : url.substring(0, 40) + '...';

    tracks.push({ title, url });
    saveTracks(artist, tracks);
    renderTracks(artist);
    input.value = '';
}

function deleteTrack(artist, index) {
    const tracks = getTracks(artist);
    tracks.splice(index, 1);
    saveTracks(artist, tracks);
    renderTracks(artist);
}

['coldplay', 'humbe', 'jorge'].forEach(renderTracks);

// ============================================
// Razones
// ============================================
let reasons;
try { reasons = JSON.parse(localStorage.getItem('reasons')); } catch (e) {}
if (!Array.isArray(reasons)) reasons = [
    'Porque tu sonrisa ilumina mis días',
    'Porque contigo todo es mejor',
    'Porque eres única',
    'Porque me haces feliz',
    'Porque tu forma de ser me enamora',
    'Porque cada día te admiro más',
    'Porque tu mirada lo dice todo',
    'Porque eres mi lugar seguro',
    'Porque me inspiras a ser mejor',
    'Porque eres la persona más especial'
];

function saveReasons() {
    localStorage.setItem('reasons', JSON.stringify(reasons));
}

function renderReasons() {
    const list = document.getElementById('reasons-list');
    if (!list) { console.warn('reasons-list not found'); return; }
    if (!Array.isArray(reasons) || reasons.length === 0) { list.innerHTML = '<p style="color:var(--text-muted)">No hay razones aún. Agregá la primera 💕</p>'; return; }
    list.innerHTML = reasons.map((r, i) => `
        <div class="reason-card">
            <span class="reason-number">${i + 1}</span>
            <p>${r}</p>
            <button class="btn-small" onclick="deleteReason(${i})" style="margin-left:auto;">✕</button>
        </div>
    `).join('');
}

function addReason() {
    const text = prompt('¿Qué amas de ella?');
    if (text && text.trim()) {
        reasons.push(text.trim());
        saveReasons();
        renderReasons();
    }
}

function deleteReason(index) {
    reasons.splice(index, 1);
    saveReasons();
    renderReasons();
}

renderReasons();

// ============================================
// Calendario
// ============================================
let calendarEvents; try { calendarEvents = JSON.parse(localStorage.getItem('calendarEvents')); } catch(e) {}
if (!Array.isArray(calendarEvents)) calendarEvents = [];
let calendarMonth = new Date().getMonth();
let calendarYear = new Date().getFullYear();

function saveCalendarEvents() {
    localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents));
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const label = document.getElementById('calendarMonthYear');
    if (!grid || !label) return;

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const daysInPrev = new Date(calendarYear, calendarMonth, 0).getDate();
    const today = new Date();

    label.textContent = `${monthNames[calendarMonth]} ${calendarYear}`;

    let html = dayNames.map(d => `<div class="calendar-day-header">${d}</div>`).join('');

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        html += `<div class="calendar-day other-month">${daysInPrev - i}</div>`;
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = today.getFullYear() === calendarYear && today.getMonth() === calendarMonth && today.getDate() === d;
        const hasEvent = calendarEvents.some(e => e.date === dateStr);
        const cls = `calendar-day${isToday ? ' today' : ''}${hasEvent ? ' has-event' : ''}`;
        html += `<div class="${cls}" onclick="showDayEvents('${dateStr}')">${d}</div>`;
    }

    grid.innerHTML = html;

    // Show events for today by default
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    showDayEvents(todayStr);
    renderAllEvents();
}

function changeMonth(delta) {
    calendarMonth += delta;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    renderCalendar();
}

function showDayEvents(dateStr) {
    const container = document.getElementById('calendarEvents');
    const events = calendarEvents.filter(e => e.date === dateStr);
    if (events.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted);font-size:0.9rem;">Sin eventos en esta fecha</p>`;
    } else {
        container.innerHTML = events.map((e, i) => `
            <div class="calendar-event-item">
                <span class="event-date">${e.date}</span>
                <span class="event-title">${e.title}</span>
                <button class="event-delete" onclick="deleteCalendarEvent(${calendarEvents.indexOf(e)})">✕</button>
            </div>
        `).join('');
    }
}

function renderAllEvents() {
    // Also show all events below
}

function addCalendarEvent() {
    const date = document.getElementById('eventDate').value;
    const title = document.getElementById('eventTitle').value.trim();
    if (!date || !title) return alert('Completá fecha y título.');

    calendarEvents.push({ date, title });
    saveCalendarEvents();
    renderCalendar();
    document.getElementById('eventTitle').value = '';
}

function deleteCalendarEvent(index) {
    calendarEvents.splice(index, 1);
    saveCalendarEvents();
    renderCalendar();
}

renderCalendar();

// ============================================
// Infografía
// ============================================
function getInfographicData() {
    const now = new Date();
    const start = CONFIG.startDate;
    const diff = now - start;
    const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    const totalHours = Math.floor(diff / (1000 * 60 * 60));

    const defaults = [
        { icon: '💕', value: `${Math.floor(totalDays / 30.44)}`, label: 'Meses de amor' },
        { icon: '📅', value: `${totalDays}`, label: 'Días juntos' },
        { icon: '⏰', value: `${totalHours.toLocaleString()}`, label: 'Horas de felicidad' },
        { icon: '🎵', value: '3', label: 'Artistas favoritos' },
        { icon: '📍', value: `${markers.length}`, label: 'Lugares marcados' },
        { icon: '📸', value: `${galleryPhotos.length}`, label: 'Fotos guardadas' },
        { icon: '💌', value: `${document.querySelectorAll('.letter-card').length || letters.length}`, label: 'Cartas de amor' },
        { icon: '📝', value: `${reasons.length}`, label: 'Razones de amor' }
    ];

    return defaults;
}

function renderInfographics() {
    const grid = document.getElementById('infographicsGrid');
    if (!grid) return;

    const custom = JSON.parse(localStorage.getItem('customInfographics')) || [];
    const data = [...getInfographicData(), ...custom];

    grid.innerHTML = data.map(d => `
        <div class="infographic-card">
            <span class="info-icon">${d.icon}</span>
            <div class="info-value">${d.value}</div>
            <div class="info-label">${d.label}</div>
        </div>
    `).join('');
}

function addCustomInfographic() {
    const label = document.getElementById('infraLabel').value.trim();
    const value = document.getElementById('infraValue').value.trim();
    const icon = document.getElementById('infraIcon').value.trim() || '❤️';
    if (!label || !value) return alert('Completá etiqueta y valor.');

    const custom = JSON.parse(localStorage.getItem('customInfographics')) || [];
    custom.push({ icon, value, label });
    localStorage.setItem('customInfographics', JSON.stringify(custom));
    renderInfographics();

    document.getElementById('infraLabel').value = '';
    document.getElementById('infraValue').value = '';
    document.getElementById('infraIcon').value = '';
}

// renderInfographics() — se llama más abajo, después de declarar letters

// ============================================
// Quiz
// ============================================
const quizQuestions = [
    { question: '¿En qué mes empezamos nuestra relación?', options: ['Enero', 'Febrero', 'Marzo', 'Abril'], correct: 1 },
    { question: '¿Qué día celebramos nuestro aniversario cada mes?', options: ['15', '20', '27', '30'], correct: 2 },
    { question: '¿Cuál es nuestro artista favorito?', options: ['Coldplay', 'Jorge Cuellar', 'Humbe', 'Todos'], correct: 3 },
    { question: '¿Quién dijo "te amo" primero?', options: ['Yo (Jose)', 'Anahí', 'Los dos', 'Nadie'], correct: 0 },
    { question: '¿Cuánto tiempo llevamos juntos?', options: ['Menos de 1 mes', '1-3 meses', '3-6 meses', 'Más de 6 meses'], correct: 1 }
];

let currentQuestion = 0;
let quizScore = 0;
let quizAnswered = false;

function renderQuestion() {
    const q = quizQuestions[currentQuestion];
    document.getElementById('quizProgress').textContent = `Pregunta ${currentQuestion + 1} de ${quizQuestions.length}`;
    document.getElementById('quizScore').textContent = `Puntaje: ${quizScore}`;
    document.getElementById('quizQuestion').textContent = q.question;
    document.getElementById('quizNextBtn').style.display = 'none';
    document.getElementById('quizResult').style.display = 'none';
    quizAnswered = false;

    document.getElementById('quizOptions').innerHTML = q.options.map((opt, i) =>
        `<button class="quiz-option" onclick="selectAnswer(${i})">${opt}</button>`
    ).join('');
}

function selectAnswer(index) {
    if (quizAnswered) return;
    quizAnswered = true;

    const q = quizQuestions[currentQuestion];
    document.querySelectorAll('.quiz-option').forEach((opt, i) => {
        opt.classList.add('disabled');
        if (i === q.correct) opt.classList.add('correct');
        if (i === index && i !== q.correct) opt.classList.add('wrong');
    });

    if (index === q.correct) quizScore++;
    document.getElementById('quizScore').textContent = `Puntaje: ${quizScore}`;
    document.getElementById('quizNextBtn').style.display = 'block';
    document.getElementById('quizNextBtn').textContent = currentQuestion < quizQuestions.length - 1 ? 'Siguiente' : 'Ver Resultado';
}

function nextQuestion() {
    currentQuestion++;
    if (currentQuestion < quizQuestions.length) {
        renderQuestion();
    } else {
        showQuizResult();
    }
}

function showQuizResult() {
    document.getElementById('quizQuestion').style.display = 'none';
    document.getElementById('quizOptions').style.display = 'none';
    document.getElementById('quizNextBtn').style.display = 'none';
    document.getElementById('quizProgress').style.display = 'none';

    const total = quizQuestions.length;
    const percent = Math.round((quizScore / total) * 100);
    let emoji, msg;

    if (percent === 100) { emoji = '🏆'; msg = '¡Perfecto! Nos conocés al 100%'; }
    else if (percent >= 80) { emoji = '💕'; msg = 'Casi perfecto. Me conocés muy bien.'; }
    else if (percent >= 60) { emoji = '😊'; msg = 'Vas bien. Pero te falta conocerme más.'; }
    else { emoji = '🤔'; msg = '¿Seguro que soy yo? Tenemos que hablar más.'; }

    document.getElementById('quizResult').style.display = 'block';
    document.getElementById('quizResult').innerHTML = `
        <h3>${emoji} ${quizScore}/${total}</h3>
        <p>${msg}</p>
        <button class="btn" onclick="resetQuiz()">Reintentar</button>
    `;
}

function resetQuiz() {
    currentQuestion = 0;
    quizScore = 0;
    document.getElementById('quizQuestion').style.display = 'block';
    document.getElementById('quizOptions').style.display = 'grid';
    document.getElementById('quizProgress').style.display = 'flex';
    renderQuestion();
}

renderQuestion();

// ============================================
// Nube de palabras
// ============================================
let words; try { words = JSON.parse(localStorage.getItem('wordcloud')); } catch(e) {}
if (!Array.isArray(words)) words = [
    'Amor', 'Risas', 'Música', '27', 'Café', 'Abrazos', 'Beso',
    'Confianza', 'Humbe', 'Coldplay', 'Jorge Cuellar', 'Baile'
];

function saveWords() {
    localStorage.setItem('wordcloud', JSON.stringify(words));
}

function renderWordCloud() {
    const container = document.getElementById('wordcloudDisplay');
    if (!container) return;

    container.innerHTML = words.map((word, i) => {
        const size = Math.min(2.5, Math.max(0.8, 1.5 - (i * 0.03)));
        const hue = (i * 27 + 340) % 360;
        return `<span class="wordcloud-word" style="font-size:${size}rem;color:hsl(${hue},70%,70%);animation-delay:${i * 0.05}s" onclick="deleteWord(${i}, this)">${word}</span>`;
    }).join('');
}

function deleteWord(index, el) {
    el.classList.add('deleting');
    setTimeout(() => {
        words.splice(index, 1);
        saveWords();
        renderWordCloud();
    }, 300);
}

document.addEventListener('DOMContentLoaded', () => {
    const wordInput = document.getElementById('wordInput');
    if (!wordInput) return;
    wordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const text = wordInput.value.trim();
            if (text && !words.includes(text)) {
                words.push(text);
                saveWords();
                renderWordCloud();
                wordInput.value = '';
            }
        }
    });
});

renderWordCloud();

// ============================================
// Cartas de amor
// ============================================
let letters; try { letters = JSON.parse(localStorage.getItem('letters')); } catch(e) {}
if (!Array.isArray(letters)) letters = [
    { title: 'Para mi Anahí ❤️', body: 'Eres la persona más especial que ha llegado a mi vida. Cada 27 contigo es el mejor día del mes. Gracias por existir y por hacer mis días más brillantes. Te amo con todo mi corazón.' }
];

function saveLetters() {
    localStorage.setItem('letters', JSON.stringify(letters));
}

function renderLetters() {
    const container = document.getElementById('letters-container');
    if (!container) return;
    container.innerHTML = letters.map((letter, i) => `
        <div class="letter-card">
            <h3>${letter.title}</h3>
            <p class="letter-preview">${letter.body.substring(0, 80)}${letter.body.length > 80 ? '...' : ''}</p>
            <button class="btn-small" onclick="openLetter(${i})">Leer más</button>
            <button class="btn-small" onclick="deleteLetter(${i})" style="border-color:var(--text-muted);color:var(--text-muted);margin-left:0.5rem;">Eliminar</button>
        </div>
    `).join('');
}

function openLetter(index) {
    const letter = letters[index];
    document.getElementById('modal-title').textContent = letter.title;
    document.getElementById('modal-body').textContent = letter.body;
    document.getElementById('letter-modal').classList.add('show');
}

function closeModal() {
    document.getElementById('letter-modal').classList.remove('show');
}

function showWriteLetter() {
    document.getElementById('write-modal').classList.add('show');
    document.getElementById('letter-title-input').value = '';
    document.getElementById('letter-body-input').value = '';
}

function closeWriteModal() {
    document.getElementById('write-modal').classList.remove('show');
}

function saveLetter() {
    const title = document.getElementById('letter-title-input').value.trim();
    const body = document.getElementById('letter-body-input').value.trim();
    if (title && body) {
        letters.push({ title, body });
        saveLetters();
        renderLetters();
        closeWriteModal();
    } else {
        alert('Escribe un título y el cuerpo de la carta.');
    }
}

function deleteLetter(index) {
    if (confirm('¿Eliminar esta carta?')) {
        letters.splice(index, 1);
        saveLetters();
        renderLetters();
    }
}

renderLetters();
renderInfographics();

// ============================================
// Sorpresa con confetti
// ============================================
function openSurprise() {
    document.getElementById('surpriseModal').classList.add('show');
    const saved = localStorage.getItem('surpriseMessage');
    if (saved) {
        document.getElementById('surpriseText').textContent = saved;
        document.getElementById('surpriseEditor').value = saved;
    }
}

function closeSurprise() {
    document.getElementById('surpriseModal').classList.remove('show');
}

function saveSurprise() {
    const text = document.getElementById('surpriseEditor').value.trim();
    if (text) {
        localStorage.setItem('surpriseMessage', text);
        document.getElementById('surpriseText').textContent = text;
        alert('💕 Mensaje sorpresa guardado');
    }
}

function triggerConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = [];
    const colors = ['#e74c6f', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#e8a0b4', '#f1c40f'];

    for (let i = 0; i < 150; i++) {
        pieces.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            w: Math.random() * 10 + 5,
            h: Math.random() * 6 + 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 3 + 2,
            rot: Math.random() * 360,
            rotSpeed: (Math.random() - 0.5) * 10
        });
    }

    let frames = 0;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;

        pieces.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;
            p.rot += p.rotSpeed;

            if (p.y < canvas.height + 20) active = true;

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot * Math.PI / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });

        frames++;
        if (frames < 200 && active) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    animate();
}

window.addEventListener('resize', () => {
    const canvas = document.getElementById('confettiCanvas');
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
});

// ============================================
// Close modals on outside click
// ============================================
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('show');
    }
    if (e.target.classList.contains('surprise-modal')) {
        e.target.classList.remove('show');
    }
});

// Loading screen handled inline in HTML

// ============================================
// Letras de canciones
// ============================================
const lyricsData = [
    {
        artist: 'Coldplay',
        song: 'Yellow',
        accent: '#1DB954',
        lyrics: `Look at the stars\nLook how they shine for you\nAnd everything you do\nYeah, they were all yellow\n\nI came along\nI wrote a song for you\nAnd all the things you do\nAnd it was called "Yellow"`,
    },
    {
        artist: 'Coldplay',
        song: 'Fix You',
        accent: '#1DB954',
        lyrics: `Lights will guide you home\nAnd ignite your bones\nAnd I will try to fix you\n\nTears stream down your face\nWhen you lose something you cannot replace`,
    },
    {
        artist: 'Coldplay',
        song: 'The Scientist',
        accent: '#1DB954',
        lyrics: `Nobody said it was easy\nNo one ever said it would be this hard\nOh, take me back to the start\n\nI was just guessing at numbers and figures\nPulling the puzzles apart`,
    },
    {
        artist: 'Humbe',
        song: 'Entraban',
        accent: '#E74C6F',
        lyrics: `Y si algún día no estás\nVoy a buscarte en cada amanecer\nPorque todo me recuerda a ti\nY no sé cómo aprender a vivir sin ti`,
    },
    {
        artist: 'Humbe',
        song: 'Ardía',
        accent: '#E74C6F',
        lyrics: `Ardía cuando te veía\nArdía cuando no estabas\nY aunque pasaban los días\nSiempre te esperaba`,
    },
    {
        artist: 'Humbe',
        song: 'Fantasma',
        accent: '#E74C6F',
        lyrics: `Eres tú, siempre fuiste tú\nNo hay nadie más que pueda\nHacerme sentir así\nComo cuando estás aquí`,
    },
    {
        artist: 'Jorge Cuellar',
        song: 'Miel',
        accent: '#FF6B35',
        lyrics: `Eres miel en mis mañanas\nDulce y lento amanecer\nCada vez que estás conmigo\nEl mundo deja de doler`,
    },
    {
        artist: 'Jorge Cuellar',
        song: 'Otra Noche',
        accent: '#FF6B35',
        lyrics: `Otra noche sin dormir\nPensando en tu mirar\nOjalá pudiera estar\nOtra noche junto a ti`,
    },
    {
        artist: 'Jorge Cuellar',
        song: 'Te Vas',
        accent: '#FF6B35',
        lyrics: `Y te vas, y te vas\nDejando huella en mi piel\nY aunque digas que no volverás\nSé que vuelves porque soy fiel`,
    }
];

function renderLyrics() {
    const container = document.getElementById('lyricsContainer');
    if (!container) return;

    container.innerHTML = lyricsData.map((item, i) => `
        <div class="lyrics-card" onclick="toggleLyrics(${i})">
            <div class="lyrics-header">
                <h3>"${item.song}"</h3>
                <span class="lyrics-toggle">▼</span>
            </div>
            <div class="lyrics-body">
                <p>${item.lyrics}</p>
                <div class="lyrics-artist" style="color:${item.accent}">— ${item.artist}</div>
            </div>
        </div>
    `).join('');
}

function toggleLyrics(index) {
    const cards = document.querySelectorAll('.lyrics-card');
    cards.forEach((c, i) => {
        if (i === index) c.classList.toggle('open');
        else c.classList.remove('open');
    });
}

renderLyrics();

// ============================================
// Próximo 27
// ============================================
function updateNext27() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let next27 = new Date(currentYear, currentMonth, 27);

    if (now.getDate() >= 27 && now.getHours() >= 0) {
        next27 = new Date(currentYear, currentMonth + 1, 27);
    }

    const diff = next27 - now;
    if (diff <= 0) return;

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    document.getElementById('nextDays').textContent = days;
    document.getElementById('nextHours').textContent = String(hours).padStart(2, '0');
    document.getElementById('nextMinutes').textContent = String(minutes).padStart(2, '0');
    document.getElementById('nextSeconds').textContent = String(seconds).padStart(2, '0');
}

updateNext27();
setInterval(updateNext27, 1000);

// ============================================
// Test de compatibilidad
// ============================================
const compatQuestions = [
    { q: '¿Cuál es el color favorito de Anahí?', a: ['Rojo', 'Rosa', 'Azul', 'Negro'], correct: 1 },
    { q: '¿Qué comida prefiere Jose?', a: ['Pizza', 'Pasta', 'Hamburguesa', 'Sushi'], correct: 0 },
    { q: '¿Cuál es el plan ideal para un 27?', a: ['Cine', 'Cena romántica', 'Caminar', 'Netflix'], correct: 1 },
    { q: '¿Quién es más desordenado?', a: ['Jose', 'Anahí', 'Los dos', 'Ninguno'], correct: 0 },
    { q: '¿Qué les gusta hacer juntos?', a: ['Escuchar música', 'Cocinar', 'Viajar', 'Todo'], correct: 3 },
];

let compatPhase = 0; // 0=jose, 1=anahi, 2=result
let compatQuestionIndex = 0;
let joseAnswers = [];
let anahiAnswers = [];

function renderCompatQuestion() {
    const q = compatQuestions[compatQuestionIndex];
    const phaseEl = document.getElementById('compatPhase1');
    const questionEl = document.getElementById('compatQuestion');
    const optionsEl = document.getElementById('compatOptions');
    const nextBtn = document.getElementById('compatNextBtn');
    const resultEl = document.getElementById('compatResult');
    const compatContainer = document.getElementById('compatContainer');

    resultEl.style.display = 'none';
    nextBtn.style.display = 'none';

    if (compatPhase === 2) {
        showCompatResult();
        return;
    }

    phaseEl.innerHTML = `
        <h3>${compatPhase === 0 ? 'Turno de Jose' : 'Turno de Anahí'}</h3>
        <p>${compatPhase === 0 ? 'Respondé vos primero, Anahí no mire 👀' : 'Ahora respondé vos, Anahí 💕'}</p>
    `;
    document.getElementById('compatCount').textContent = `${compatQuestionIndex + 1}/${compatQuestions.length}`;
    questionEl.textContent = q.q;

    optionsEl.innerHTML = q.a.map((opt, i) => `
        <button class="compat-option" onclick="selectCompatOption(${i}, this)">${opt}</button>
    `).join('');
}

function selectCompatOption(index, btn) {
    document.querySelectorAll('.compat-option').forEach(el => {
        el.classList.remove('selected');
        el.classList.add('disabled');
    });
    btn.classList.add('selected');

    if (compatPhase === 0) joseAnswers[compatQuestionIndex] = index;
    else anahiAnswers[compatQuestionIndex] = index;

    document.getElementById('compatNextBtn').style.display = 'block';
}

function nextCompatQuestion() {
    compatQuestionIndex++;
    if (compatQuestionIndex < compatQuestions.length) {
        renderCompatQuestion();
    } else {
        compatQuestionIndex = 0;
        compatPhase++;
        if (compatPhase < 2) {
            renderCompatQuestion();
        } else {
            showCompatResult();
        }
    }
}

function showCompatResult() {
    const container = document.getElementById('compatContainer');
    const resultEl = document.getElementById('compatResult');

    let matches = 0;
    compatQuestions.forEach((_, i) => {
        if (joseAnswers[i] === anahiAnswers[i]) matches++;
    });

    const pct = Math.round((matches / compatQuestions.length) * 100);
    let emoji, msg;

    if (pct >= 80) { emoji = '💞'; msg = '¡Almas gemelas! Están perfectamente sincronizados.'; }
    else if (pct >= 60) { emoji = '💕'; msg = 'Se conocen bien, pero aún hay sorpresas.'; }
    else if (pct >= 40) { emoji = '💗'; msg = 'Hay conexión, pero falta conocerse más.'; }
    else { emoji = '💔'; msg = '¿Seguro que son pareja? 🤣 Hablen más.'; }

    document.querySelector('.compat-phase').style.display = 'none';
    document.getElementById('compatQuestion').style.display = 'none';
    document.getElementById('compatOptions').style.display = 'none';
    document.getElementById('compatNextBtn').style.display = 'none';
    document.getElementById('compatCount').style.display = 'none';

    resultEl.style.display = 'block';
    resultEl.innerHTML = `
        <h3>${emoji} Compatibilidad</h3>
        <div class="compat-score">${pct}%</div>
        <p>${matches}/${compatQuestions.length} respuestas coinciden</p>
        <p style="margin-top:1rem;color:var(--accent)">${msg}</p>
        <button class="btn" onclick="resetCompat()">🔄 Intentar de nuevo</button>
    `;
}

function resetCompat() {
    compatPhase = 0;
    compatQuestionIndex = 0;
    joseAnswers = [];
    anahiAnswers = [];

    document.querySelector('.compat-phase').style.display = 'block';
    document.getElementById('compatQuestion').style.display = 'block';
    document.getElementById('compatOptions').style.display = 'grid';
    document.getElementById('compatCount').style.display = 'block';

    renderCompatQuestion();
}

renderCompatQuestion();

// ============================================
// Vela virtual
// ============================================
let candleLit = true;

function initCandle() {
    // Device orientation
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', (e) => {
            if (Math.abs(e.gamma) > 30 && candleLit) {
                blowCandle();
            }
        });
    }

    // Mouse movement
    document.addEventListener('mousemove', (e) => {
        if (candleLit) {
            const rect = document.getElementById('candle').getBoundingClientRect();
            const candleX = rect.left + rect.width / 2;
            const candleY = rect.top + rect.height / 2;
            const dist = Math.sqrt((e.clientX - candleX) ** 2 + (e.clientY - candleY) ** 2);
            if (dist < 150) {
                const flame = document.getElementById('candleFlame');
                const dx = (e.clientX - candleX) / 30;
                const dy = (e.clientY - candleY) / 30;
                flame.style.transform = `translateX(calc(-50% + ${dx}px)) translateY(${dy}px)`;
            }
        }
    });
}

function blowCandle() {
    if (!candleLit) return;
    candleLit = false;
    document.getElementById('candleFlame').classList.add('extinct');
    document.getElementById('candleHint').textContent = '🕯️ Pedí un deseo... ¡Se cumplirá! 💫';

    // Show smoke
    const smoke = document.getElementById('candleSmoke');
    smoke.style.display = 'block';
    smoke.innerHTML = '';
    for (let i = 0; i < 8; i++) {
        const puff = document.createElement('span');
        puff.textContent = '💨';
        puff.style.cssText = `
            position:absolute; font-size:1.5rem;
            animation: smokeRise ${1.5 + Math.random()}s ease forwards;
            animation-delay: ${i * 0.1}s;
            left: ${(Math.random() - 0.5) * 40}px;
            opacity: 0;
        `;
        smoke.appendChild(puff);
    }
}

// Add smoke animation
const smokeStyle = document.createElement('style');
smokeStyle.textContent = `
    @keyframes smokeRise {
        0% { transform: translateY(0) scale(0.5); opacity: 0.8; }
        100% { transform: translateY(-80px) scale(1.5); opacity: 0; }
    }
`;
document.head.appendChild(smokeStyle);

function relightCandle() {
    candleLit = true;
    const flame = document.getElementById('candleFlame');
    flame.classList.remove('extinct');
    flame.style.transform = '';
    document.getElementById('candleHint').textContent = 'Soplá o mové el dispositivo para apagar la vela 🕯️';
    document.getElementById('candleSmoke').innerHTML = '';
    document.getElementById('candleSmoke').style.display = 'none';
}

initCandle();

// ============================================
// Libro interactivo
// ============================================
let currentPage = 0;
const totalPages = 5;

function showPage(index) {
    for (let i = 0; i < totalPages; i++) {
        const page = document.getElementById(`bookPage${i + 1}`);
        if (!page) continue;
        if (i === index) {
            page.classList.remove('hidden');
            page.classList.remove('flipped');
        } else if (i < index) {
            page.classList.remove('hidden');
            page.classList.add('flipped');
        } else {
            page.classList.add('hidden');
            page.classList.remove('flipped');
        }
    }
    document.getElementById('bookCounter').textContent = `${index + 1} / ${totalPages}`;
}

function nextPage() {
    if (currentPage < totalPages - 1) {
        currentPage++;
        showPage(currentPage);
    }
}

function prevPage() {
    if (currentPage > 0) {
        currentPage--;
        showPage(currentPage);
    }
}

showPage(0);

// ============================================
// Storage info & Backup
// ============================================
async function updateStorageInfo() {
    const el = document.getElementById('storageInfo');
    if (!el) return;
    try {
        const info = await getStorageInfo();
        el.querySelector('.storage-indicator').textContent =
            `💾 ${info.galleryCount} fotos · ${info.timelineCount} en timeline · ${info.formattedSize}`;
    } catch (e) {
        el.querySelector('.storage-indicator').textContent = `💾 Almacenamiento disponible`;
    }
}

async function exportBackup() {
    const gallery = await getAllGalleryPhotos();
    const db = await openDB();
    const allTimeline = await new Promise((resolve, reject) => {
        const tx = db.transaction('timeline', 'readonly');
        const store = tx.objectStore('timeline');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
    });

    const backup = {
        version: 2,
        date: new Date().toISOString(),
        gallery: await Promise.all(gallery.map(async (item) => ({
            id: item.id,
            timestamp: item.timestamp,
            blob: await blobToBase64(item.blob)
        }))),
        timeline: await Promise.all(allTimeline.map(async (item) => ({
            id: item.id,
            month: item.month,
            timestamp: item.timestamp,
            blob: await blobToBase64(item.blob)
        }))),
        timelineNotes,
        localStorage: {}
    };

    // Save important localStorage keys
    ['reasons', 'letters', 'wordcloud', 'calendarEvents', 'customInfographics',
     'mapMarkers', 'tracks_coldplay', 'tracks_humbe', 'tracks_jorge',
     'specialMessage', 'surpriseMessage', 'theme', 'timelineNotes'].forEach(k => {
        const val = localStorage.getItem(k);
        if (val) backup.localStorage[k] = val;
    });

    const json = JSON.stringify(backup);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-jose-anahi-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!confirm('⚠️ Esto reemplazará todos los datos actuales. ¿Continuar?')) return;

    try {
        const text = await file.text();
        const backup = JSON.parse(text);

        if (backup.version !== 2) {
            alert('Versión de backup no compatible.');
            return;
        }

        // Restore localStorage
        for (const [k, v] of Object.entries(backup.localStorage)) {
            localStorage.setItem(k, v);
        }

        // Clear and restore gallery
        await clearGalleryPhotos();
        for (const item of backup.gallery) {
            const blob = await base64ToBlob(item.blob);
            await addGalleryPhoto(blob);
        }

        // Clear and restore timeline
        const db = await openDB();
        await new Promise((resolve, reject) => {
            const tx = db.transaction('timeline', 'readwrite');
            const store = tx.objectStore('timeline');
            const req = store.clear();
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
        for (const item of backup.timeline) {
            const blob = await base64ToBlob(item.blob);
            await addTimelinePhoto(item.month, blob);
        }

        if (backup.timelineNotes) {
            timelineNotes = backup.timelineNotes;
            saveTimelineNotes();
        }

        // Reload everything
        loadGallery();
        renderTimeline();
        renderReasons();
        renderLetters();
        renderWordCloud();
        renderCalendar();
        renderMarkerList();
        ['coldplay', 'humbe', 'jorge'].forEach(renderTracks);
        updateStorageInfo();

        alert('✅ Backup restaurado correctamente.');
        location.reload();
    } catch (e) {
        alert('❌ Error al importar el backup: ' + e.message);
    }
}

function base64ToBlob(base64) {
    return fetch(base64).then(r => r.blob());
}

// ============================================
// Reproductor de canciones
// ============================================
function getEmbedUrl(link) {
    if (!link) return '';
    const spotifyMatch = link.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
    if (spotifyMatch) return `https://open.spotify.com/embed/track/${spotifyMatch[1]}`;
    const ytMatch = link.match(/(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    return '';
}

function renderPlayerTracks() {
    const artist = document.getElementById('playerArtist').value;
    const container = document.getElementById('playerTracks');
    const embed = document.getElementById('playerEmbed');
    const tracks = getTracks(artist);

    container.innerHTML = tracks.map((t, i) => `
        <span class="player-track-chip" onclick="playTrack('${artist}', ${i})">${t.name || 'Track ' + (i + 1)}</span>
    `).join('');

    if (tracks.length === 0) {
        embed.innerHTML = '<p class="player-placeholder">No hay canciones para este artista. Agregalas en la playlist primero 🎵</p>';
    } else {
        embed.innerHTML = '<p class="player-placeholder">Seleccioná una canción para reproducirla</p>';
    }
}

function playTrack(artist, index) {
    const tracks = getTracks(artist);
    const track = tracks[index];
    if (!track || !track.link) return;

    const embed = document.getElementById('playerEmbed');
    const url = getEmbedUrl(track.link);

    if (url) {
        embed.innerHTML = `<iframe src="${url}" allow="encrypted-media" allowtransparency="true" loading="lazy"></iframe>`;
    } else {
        embed.innerHTML = `<p class="player-placeholder">🔗 <a href="${track.link}" target="_blank" style="color:var(--accent)">Abrir canción</a></p>`;
    }

    document.querySelectorAll('.player-track-chip').forEach((c, i) => {
        c.classList.toggle('active', i === index);
    });
}

renderPlayerTracks();

// ============================================
// Carrusel de fotos
// ============================================
let carouselIndex = 0;
let carouselAuto = true;
let carouselTimer = null;

function startCarousel() {
    const viewport = document.getElementById('carouselViewport');
    const img = document.getElementById('carouselImg');

    if (galleryPhotos.length === 0) {
        img.style.display = 'none';
        viewport.innerHTML = '<span class="carousel-empty">Subí fotos en la galería primero 📷</span>';
        document.getElementById('carouselCounter').textContent = '0 / 0';
        return;
    }

    viewport.innerHTML = '';
    viewport.appendChild(img);
    img.style.display = 'block';
    carouselIndex = Math.min(carouselIndex, galleryPhotos.length - 1);
    showCarouselImage();
    updateCarouselCounter();
    resetCarouselTimer();
}

function showCarouselImage() {
    const img = document.getElementById('carouselImg');
    if (galleryPhotos.length === 0 || !img) return;

    const item = galleryPhotos[carouselIndex];
    if (item && item.blob) {
        img.src = URL.createObjectURL(item.blob);
        img.style.display = 'block';
    }
}

function updateCarouselCounter() {
    document.getElementById('carouselCounter').textContent = `${galleryPhotos.length > 0 ? carouselIndex + 1 : 0} / ${galleryPhotos.length}`;
}

function resetCarouselTimer() {
    if (carouselTimer) clearInterval(carouselTimer);
    if (carouselAuto && galleryPhotos.length > 0) {
        carouselTimer = setInterval(() => {
            carouselIndex = (carouselIndex + 1) % galleryPhotos.length;
            showCarouselImage();
            updateCarouselCounter();
        }, 4000);
    }
}

function carouselNext() {
    if (galleryPhotos.length === 0) return;
    carouselIndex = (carouselIndex + 1) % galleryPhotos.length;
    showCarouselImage();
    updateCarouselCounter();
    resetCarouselTimer();
}

function carouselPrev() {
    if (galleryPhotos.length === 0) return;
    carouselIndex = (carouselIndex - 1 + galleryPhotos.length) % galleryPhotos.length;
    showCarouselImage();
    updateCarouselCounter();
    resetCarouselTimer();
}

function toggleCarouselAuto() {
    carouselAuto = !carouselAuto;
    document.getElementById('carouselBtn').textContent = carouselAuto ? '⏸ Pausar' : '▶ Reanudar';
    resetCarouselTimer();
}

// ============================================
// Cápsula del Tiempo
// ============================================
function saveCapsula() {
    const msg = document.getElementById('capsulaMessage').value.trim();
    const date = document.getElementById('capsulaDate').value;
    if (!msg) return alert('Escribí un mensaje para la cápsula.');
    if (!date) return alert('Elegí una fecha para abrir la cápsula.');

    const capsula = { message: msg, unlockDate: date, createdAt: Date.now() };
    localStorage.setItem('timeCapsule', JSON.stringify(capsula));
    renderCapsula();
}

function deleteCapsula() {
    if (confirm('¿Eliminar la cápsula del tiempo?')) {
        localStorage.removeItem('timeCapsule');
        renderCapsula();
    }
}

function renderCapsula() {
    const form = document.getElementById('capsulaForm');
    const status = document.getElementById('capsulaStatus');
    const raw = localStorage.getItem('timeCapsule');

    if (!raw) {
        form.style.display = 'flex';
        status.style.display = 'none';
        return;
    }

    let capsula;
    try { capsula = JSON.parse(raw); } catch(e) { return; }

    form.style.display = 'none';
    status.style.display = 'block';

    const now = new Date();
    const unlock = new Date(capsula.unlockDate + 'T23:59:59');
    const diff = unlock - now;

    if (diff <= 0) {
        status.innerHTML = `
            <div class="capsula-unlocked">🔓 ¡Cápsula desbloqueada!</div>
            <div class="capsula-msg">${capsula.message.replace(/\n/g, '<br>')}</div>
            <button class="btn-small" onclick="deleteCapsula()" style="margin-top:1rem;border-color:var(--text-muted);color:var(--text-muted)">🗑 Eliminar</button>
        `;
    } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        status.innerHTML = `
            <div class="capsula-locked">🔒 Cápsula sellada</div>
            <span class="capsula-countdown">${days}d ${hours}h</span>
            <div class="capsula-locked">Se abrirá el ${new Date(capsula.unlockDate).toLocaleDateString('es-ES')}</div>
            <button class="btn-small" onclick="deleteCapsula()" style="margin-top:1rem;border-color:var(--text-muted);color:var(--text-muted)">🗑 Eliminar</button>
        `;
    }
}

renderCapsula();

// ============================================
// Generador de Citas
// ============================================
const dateIdeasDefault = [
    '🌅 Ver el amanecer juntos',
    '🍳 Cocinar el desayuno en pareja',
    '🎶 Noche de karaoke solo para dos',
    '🌌 Ir a mirar las estrellas',
    '📚 Leer poemas el uno al otro',
    '🕯 Cena a la luz de las velas',
    '🎬 Maratón de películas románticas',
    '🚲 Paseo en bicicleta al atardecer',
    '🏖 Día de playa o picnic',
    '🎨 Pintar o dibujar juntos',
    '📝 Escribir una carta de amor',
    '🎭 Noche de juegos de mesa',
    '🌳 Caminata por la naturaleza',
    '📸 Sesión de fotos espontánea',
    '🎧 Escuchar música y recordar momentos'
];

let dateIdeas;

try { dateIdeas = JSON.parse(localStorage.getItem('dateIdeas')); } catch(e) {}
if (!Array.isArray(dateIdeas)) dateIdeas = [...dateIdeasDefault];

function saveDateIdeas() {
    localStorage.setItem('dateIdeas', JSON.stringify(dateIdeas));
}

function generarCita() {
    if (dateIdeas.length === 0) {
        document.getElementById('citasDisplay').textContent = 'No hay ideas. Agregá algunas primero 💡';
        return;
    }
    const idx = Math.floor(Math.random() * dateIdeas.length);
    document.getElementById('citasDisplay').textContent = dateIdeas[idx];
}

function agregarCita() {
    const input = document.getElementById('citasInput');
    const text = input.value.trim();
    if (!text) return;
    dateIdeas.push(text);
    saveDateIdeas();
    input.value = '';
    document.getElementById('citasDisplay').textContent = text;
}

updateStorageInfo();
