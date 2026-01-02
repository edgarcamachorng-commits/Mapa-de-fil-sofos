// ============================================
// ATLAS FILOSÓFICO EUROPEO - SCRIPT PRINCIPAL
// ============================================

// ===== CONFIGURACIÓN GLOBAL =====
const CONFIG = {
    // Colores por región (deben coincidir con el JSON)
    regionColors: {
        'espana': '#3498db',
        'portugal': '#2ecc71',
        'italia': '#e74c3c',
        'francia': '#9b59b6',
        'suiza': '#f1c40f',
        'belgica': '#e67e22',
        'paises_bajos': '#1abc9c',
        'alemania': '#7f8c8d',
        'austria': '#d35400',
        'república checa': '#27ae60',
        'polonia': '#c0392b',
        'estonia': '#2980b9',
        'lituania': '#8e44ad',
        'rusia': '#16a085',
        'ucrania': '#f1c40f',
        'rumania': '#e67e22',
        'bielorrusia': '#95a5a6',
        'moldavia': '#34495e',
        'grecia': '#1abc9c',
        'islas_britanicas': '#3498db',
        'suecia': '#9b59b6',
        'dinamarca': '#e74c3c',
        'noruega': '#2ecc71',
        'finlandia': '#34495e',
        'islandia': '#9b59b6'
    },
    
    // Nombres de regiones para mostrar
    regionNames: {
        'espana': 'España',
        'portugal': 'Portugal',
        'italia': 'Italia',
        'francia': 'Francia',
        'suiza': 'Suiza',
        'belgica': 'Bélgica',
        'paises_bajos': 'Países Bajos',
        'alemania': 'Alemania',
        'austria': 'Austria',
        'república checa': 'República Checa',
        'polonia': 'Polonia',
        'estonia': 'Estonia',
        'lituania': 'Lituania',
        'rusia': 'Rusia',
        'ucrania': 'Ucrania',
        'rumania': 'Rumanía',
        'bielorrusia': 'Bielorrusia',
        'moldavia': 'Moldavia',
        'grecia': 'Grecia',
        'islas_britanicas': 'Islas Británicas',
        'suecia': 'Suecia',
        'dinamarca': 'Dinamarca',
        'noruega': 'Noruega',
        'finlandia': 'Finlandia',
        'islandia': 'Islandia'
    },
    
    // Configuración del mapa
    mapConfig: {
        center: [50, 15], // Centro de Europa
        zoom: 4,
        minZoom: 3,
        maxZoom: 10,
        maxBounds: [[30, -25], [72, 50]] // Límites de Europa
    }
};

// ===== VARIABLES GLOBALES =====
let map;
let philosophers = [];
let markers = [];
let layers = {};
let currentFilter = 'all';
let currentSearch = '';
let selectedPhilosopherId = null;
let regionStats = {};

// ===== INICIALIZACIÓN DE LA APLICACIÓN =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Iniciando Atlas Filosófico Europeo...');
    
    try {
        // 1. Cargar datos
        await loadPhilosophersData();
        
        // 2. Inicializar mapa
        initMap();
        
        // 3. Inicializar interfaz
        initUI();
        
        // 4. Crear marcadores
        createMarkers();
        
        // 5. Configurar eventos
        setupEventListeners();
        
        // 6. Actualizar estadísticas
        updateStats();
        
        // 7. Actualizar fecha
        updateCurrentDate();
        
        console.log('✅ Aplicación inicializada correctamente');
    } catch (error) {
        console.error('❌ Error inicializando la aplicación:', error);
        showError('Error al cargar la aplicación. Por favor, recarga la página.');
    }
});

// ===== FUNCIÓN: CARGAR DATOS =====
async function loadPhilosophersData() {
    try {
        const response = await fetch('filosofos.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (!data.filosofos || !Array.isArray(data.filosofos)) {
            throw new Error('Formato de datos inválido');
        }
        
        philosophers = data.filosofos;
        console.log(`📊 ${philosophers.length} filósofos cargados correctamente`);
        
        // DEBUG: Mostrar regiones únicas y verificar colores
        const uniqueRegions = [...new Set(philosophers.map(p => p.region))];
        console.log('Regiones en JSON:', uniqueRegions);
        console.log('Colores disponibles en CONFIG:', Object.keys(CONFIG.regionColors));
        
        philosophers.forEach(p => {
            const color = CONFIG.regionColors[p.region];
            console.log(`${p.name.substring(0, 30)}...: región="${p.region}", color=${color || 'NO ENCONTRADO'}`);
        });
        
        // Calcular estadísticas por región
        calculateRegionStats();
        
        return true;
    } catch (error) {
        console.error('Error cargando datos:', error);
        // Mostrar datos de ejemplo si hay error
        philosophers = getSampleData();
        calculateRegionStats();
        console.log('📋 Usando datos de ejemplo');
        return false;
    }
}

// ===== FUNCIÓN: INICIALIZAR MAPA =====
function initMap() {
    console.log('🗺️ Inicializando mapa...');
    
    // Crear mapa Leaflet
    map = L.map('map', {
        center: CONFIG.mapConfig.center,
        zoom: CONFIG.mapConfig.zoom,
        minZoom: CONFIG.mapConfig.minZoom,
        maxZoom: CONFIG.mapConfig.maxZoom,
        maxBounds: CONFIG.mapConfig.maxBounds,
        maxBoundsViscosity: 1.0
    });
    
    // Añadir capa base de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Inicializar capas por región
    initLayers();
    
    console.log('✅ Mapa inicializado');
}

// ===== FUNCIÓN: INICIALIZAR CAPAS =====
function initLayers() {
    layers = {};
    
    // Crear una capa por cada región en los datos
    const uniqueRegions = [...new Set(philosophers.map(p => p.region))];
    uniqueRegions.forEach(region => {
        layers[region] = L.layerGroup();
    });
    
    // Capa especial para "todos"
    layers['all'] = L.layerGroup();
    
    // Añadir todas las capas al mapa inicialmente
    Object.values(layers).forEach(layer => {
        map.addLayer(layer);
    });
}

// ===== FUNCIÓN: INICIALIZAR INTERFAZ =====
function initUI() {
    console.log('🎨 Inicializando interfaz...');
    
    // Actualizar contador
    updatePhilosopherCount();
    
    // Crear filtros de región
    createRegionFilters();
    
    // Crear filtros de época
    createEraFilters();
    
    // Crear leyenda
    createLegend();
    
    console.log('✅ Interfaz inicializada');
}

// ===== FUNCIÓN: CREAR MARCADORES =====
function createMarkers() {
    console.log('📍 Creando marcadores...');
    
    // Limpiar marcadores existentes
    clearMarkers();
    
    philosophers.forEach((philosopher, index) => {
        const marker = createMarker(philosopher, index);
        markers.push(marker);
    });
    
    console.log(`✅ ${markers.length} marcadores creados`);
}

// ===== FUNCIÓN: CREAR UN MARCADOR INDIVIDUAL =====
function createMarker(philosopher, index) {
    // Obtener color de la región
    const regionColor = CONFIG.regionColors[philosopher.region] || '#3498db';
    
    // Crear icono personalizado
    const icon = L.divIcon({
        html: `
            <div class="philosopher-marker" style="
                background-color: ${philosopher.color || regionColor};
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: white;
                font-size: 12px;
                transition: all 0.3s ease;
            " title="${philosopher.name}">
                ${philosopher.id || index + 1}
            </div>
        `,
        className: 'custom-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
    
    // Crear marcador
    const marker = L.marker(philosopher.location, { icon })
        .addTo(layers[philosopher.region])
        .addTo(layers['all']);
    
    // Configurar tooltip
    marker.bindTooltip(`
        <div style="font-weight: bold; color: ${philosopher.color || regionColor}">
            ${philosopher.name}
        </div>
        <div style="font-size: 12px; color: #666;">
            ${philosopher.era || ''}
        </div>
    `, {
        direction: 'top',
        offset: [0, -10],
        opacity: 0.9
    });
    
    // Configurar popup
    marker.bindPopup(createPopupContent(philosopher), {
        maxWidth: 300,
        minWidth: 250,
        className: 'philosopher-popup'
    });
    
    // Añadir evento de clic
    marker.on('click', function(e) {
        selectPhilosopher(philosopher.id);
        highlightMarker(marker);
    });
    
    return marker;
}

// ===== FUNCIÓN: CREAR CONTENIDO DE POPUP =====
function createPopupContent(philosopher) {
    const regionColor = CONFIG.regionColors[philosopher.region] || '#3498db';
    
    return `
        <div class="popup-content">
            <h3 style="margin: 0 0 5px 0; color: ${regionColor}">
                ${philosopher.name}
            </h3>
            <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">
                <i class="fas fa-clock"></i> ${philosopher.era || 'Época no especificada'}
            </p>
            <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">
                <i class="fas fa-map-marker-alt"></i> ${philosopher.city || 'Ubicación no especificada'}
            </p>
            <div style="margin: 8px 0; padding: 5px; background: #f5f5f5; border-radius: 3px;">
                <strong>Área:</strong> ${philosopher.area || 'No especificada'}
            </div>
            <button onclick="window.selectPhilosopherFromPopup(${philosopher.id})" 
                    style="width: 100%; padding: 5px; background: ${regionColor}; color: white; border: none; border-radius: 3px; cursor: pointer;">
                <i class="fas fa-info-circle"></i> Ver detalles completos
            </button>
        </div>
    `;
}

// ===== FUNCIÓN: RESALTAR MARCADOR =====
function highlightMarker(marker) {
    const markerElement = marker.getElement();
    if (markerElement) {
        // Remover resaltado anterior
        markers.forEach(m => {
            const el = m.getElement();
            if (el) {
                el.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
                el.style.transform = 'scale(1)';
            }
        });
        
        // Resaltar marcador seleccionado
        markerElement.style.boxShadow = '0 0 0 3px #ffeb3b, 0 0 20px rgba(255, 235, 59, 0.5)';
        markerElement.style.transform = 'scale(1.2)';
        markerElement.classList.add('pulse-marker');
        
        // Remover clase de pulso después de la animación
        setTimeout(() => {
            markerElement.classList.remove('pulse-marker');
        }, 3000);
    }
}

// ===== FUNCIÓN: LIMPIAR MARCADORES =====
function clearMarkers() {
    markers.forEach(marker => {
        map.removeLayer(marker);
    });
    markers = [];
    
    // Limpiar todas las capas
    Object.values(layers).forEach(layer => {
        if (layer && typeof layer.clearLayers === 'function') {
            layer.clearLayers();
        }
    });
}

// ===== FUNCIÓN: CREAR FILTROS DE REGIÓN =====
function createRegionFilters() {
    const filterContainer = document.getElementById('region-filter');
    
    if (!filterContainer) {
        console.error('Contenedor de filtros no encontrado');
        return;
    }
    
    // Limpiar contenedor
    filterContainer.innerHTML = '';
    
    // Botón "Todos"
    const allButton = createRegionButton('all', 'Todos', philosophers.length);
    filterContainer.appendChild(allButton);
    
    // Crear botones para cada región con filósofos
    const uniqueRegions = [...new Set(philosophers.map(p => p.region))];
    
    uniqueRegions.sort().forEach(region => {
        const count = philosophers.filter(p => p.region === region).length;
        if (count > 0) {
            const displayName = CONFIG.regionNames[region] || 
                              region.charAt(0).toUpperCase() + region.slice(1);
            
            const button = createRegionButton(region, displayName, count);
            filterContainer.appendChild(button);
        }
    });
}

// ===== FUNCIÓN: CREAR BOTÓN DE REGIÓN =====
function createRegionButton(region, label, count) {
    const button = document.createElement('button');
    button.className = 'region-btn';
    if (region === 'all') {
        button.classList.add('active');
    }
    button.dataset.region = region;
    button.innerHTML = `
        <span>${label}</span>
        <span class="btn-counter">${count}</span>
    `;
    
    button.addEventListener('click', () => {
        filterByRegion(region);
    });
    
    return button;
}

// ===== FUNCIÓN: FILTRAR POR REGIÓN =====
function filterByRegion(region) {
    console.log(`🔍 Filtrando por región: ${region}`);
    
    // Actualizar botón activo
    document.querySelectorAll('.region-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.region === region) {
            btn.classList.add('active');
        }
    });
    
    // Actualizar filtro actual
    currentFilter = region;
    
    // Mostrar/ocultar capas según región seleccionada
    Object.keys(layers).forEach(key => {
        if (key === 'all') {
            // La capa 'all' siempre se oculta cuando filtramos
            if (layers[key]) {
                map.removeLayer(layers[key]);
            }
        } else if (region === 'all' || key === region) {
            // Mostrar esta región
            if (layers[key] && !map.hasLayer(layers[key])) {
                map.addLayer(layers[key]);
            }
        } else {
            // Ocultar esta región
            if (layers[key] && map.hasLayer(layers[key])) {
                map.removeLayer(layers[key]);
            }
        }
    });
    
    // Aplicar filtros adicionales (búsqueda, época)
    applyCurrentFilters();
    
    // Actualizar detalles si el filósofo seleccionado ya no está visible
    if (selectedPhilosopherId) {
        const philosopher = philosophers.find(p => p.id === selectedPhilosopherId);
        if (philosopher && (region !== 'all' && philosopher.region !== region)) {
            clearPhilosopherSelection();
        }
    }
    
    // Actualizar estadísticas de la vista actual
    updateCurrentViewStats();
}

// ===== FUNCIÓN: APLICAR FILTROS ACTUALES =====
function applyCurrentFilters() {
    // Primero, mostrar todos los marcadores de la región seleccionada
    markers.forEach(marker => {
        const philosopher = getPhilosopherByMarker(marker);
        if (!philosopher) return;
        
        const matchesRegion = currentFilter === 'all' || philosopher.region === currentFilter;
        
        if (matchesRegion) {
            // Añadir marcador si no está ya en el mapa
            if (!map.hasLayer(marker)) {
                map.addLayer(marker);
            }
        } else {
            // Remover marcador si está en el mapa
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        }
    });
    
    // Aplicar filtro de búsqueda si existe
    if (currentSearch) {
        applySearchFilter(currentSearch);
    }
}

// ===== FUNCIÓN: OBTENER FILÓSOFO POR MARCADOR =====
function getPhilosopherByMarker(marker) {
    const latLng = marker.getLatLng();
    return philosophers.find(p => 
        p.location[0] === latLng.lat && 
        p.location[1] === latLng.lng
    );
}

// ===== FUNCIÓN: CREAR FILTROS DE ÉPOCA =====
function createEraFilters() {
    const eraContainer = document.getElementById('era-filter');
    if (!eraContainer) return;
    
    // Extraer épocas únicas de los filósofos
    const eras = [...new Set(philosophers.map(p => p.subcategory || '').filter(Boolean))];
    
    // Ordenar épocas (podrías implementar una lógica de ordenación personalizada)
    const sortedEras = eras.sort();
    
    // Crear botones
    sortedEras.forEach(era => {
        const button = document.createElement('button');
        button.className = 'era-btn';
        button.textContent = era;
        button.title = `Filtrar por: ${era}`;
        
        button.addEventListener('click', () => {
            filterByEra(era, button);
        });
        
        eraContainer.appendChild(button);
    });
}

// ===== FUNCIÓN: FILTRAR POR ÉPOCA =====
function filterByEra(era, clickedButton) {
    console.log(`📅 Filtrando por época: ${era}`);
    
    // Alternar estado activo
    clickedButton.classList.toggle('active');
    
    // Obtener todas las épocas activas
    const activeEras = Array.from(document.querySelectorAll('.era-btn.active'))
        .map(btn => btn.textContent);
    
    // Aplicar filtros combinados
    applyCurrentFilters();
    
    // Aplicar filtro de época
    if (activeEras.length > 0) {
        markers.forEach(marker => {
            const philosopher = getPhilosopherByMarker(marker);
            if (!philosopher) return;
            
            const matchesEra = activeEras.some(activeEra => 
                philosopher.subcategory && 
                philosopher.subcategory.includes(activeEra)
            );
            
            // Mostrar/ocultar según época
            if (matchesEra && map.hasLayer(marker)) {
                // Ya está visible por otros filtros
            } else if (!matchesEra && map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        });
    }
}

// ===== FUNCIÓN: CREAR LEYENDA =====
function createLegend() {
    const legendContainer = document.getElementById('legend');
    if (!legendContainer) return;
    
    legendContainer.innerHTML = '';
    
    // Mostrar solo regiones que tienen filósofos
    const uniqueRegions = [...new Set(philosophers.map(p => p.region))];
    
    uniqueRegions.sort().forEach(region => {
        const count = philosophers.filter(p => p.region === region).length;
        if (count > 0) {
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.innerHTML = `
                <div class="legend-color" style="background-color: ${CONFIG.regionColors[region] || '#3498db'}"></div>
                <span class="legend-text">${CONFIG.regionNames[region] || region} (${count})</span>
            `;
            legendContainer.appendChild(item);
        }
    });
}

// ===== FUNCIÓN: CALCULAR ESTADÍSTICAS POR REGIÓN =====
function calculateRegionStats() {
    regionStats = {};
    
    philosophers.forEach(philosopher => {
        const region = philosopher.region;
        if (!regionStats[region]) {
            regionStats[region] = 0;
        }
        regionStats[region]++;
    });
    
    // Añadir contador para "todos"
    regionStats['all'] = philosophers.length;
}

// ===== FUNCIÓN: ACTUALIZAR ESTADÍSTICAS =====
function updateStats() {
    // Total de filósofos
    document.getElementById('total-count').textContent = philosophers.length;
    
    // Número de regiones únicas
    const uniqueRegions = new Set(philosophers.map(p => p.region)).size;
    document.getElementById('region-count').textContent = uniqueRegions;
    
    // Rango de siglos (simplificado)
    const centuries = philosophers
        .map(p => extractCentury(p.era))
        .filter(c => c !== null);
    
    if (centuries.length > 0) {
        const minCentury = Math.min(...centuries);
        const maxCentury = Math.max(...centuries);
        document.getElementById('century-range').textContent = `${minCentury} - ${maxCentury}`;
    } else {
        document.getElementById('century-range').textContent = 'N/A';
    }
}

// ===== FUNCIÓN: ACTUALIZAR ESTADÍSTICAS DE VISTA ACTUAL =====
function updateCurrentViewStats() {
    const visibleMarkers = markers.filter(marker => map.hasLayer(marker));
    document.getElementById('philosopher-count').textContent = visibleMarkers.length;
}

// ===== FUNCIÓN: EXTRAER SIGLO =====
function extractCentury(eraText) {
    if (!eraText) return null;
    
    // Buscar números de 4 dígitos (años)
    const yearMatches = eraText.match(/\b(\d{3,4})\b/g);
    if (yearMatches) {
        const years = yearMatches.map(y => parseInt(y)).filter(y => y > 0);
        if (years.length > 0) {
            const avgYear = years.reduce((a, b) => a + b, 0) / years.length;
            return Math.ceil(avgYear / 100);
        }
    }
    
    return null;
}

// ===== FUNCIÓN: SELECCIONAR FILÓSOFO =====
function selectPhilosopher(philosopherId) {
    console.log(`👤 Seleccionando filósofo ID: ${philosopherId}`);
    
    const philosopher = philosophers.find(p => p.id === philosopherId);
    if (!philosopher) {
        console.error('Filósofo no encontrado:', philosopherId);
        return;
    }
    
    // Actualizar ID seleccionado
    selectedPhilosopherId = philosopherId;
    
    // Centrar mapa en el filósofo
    map.setView(philosopher.location, 7, {
        animate: true,
        duration: 1
    });
    
    // Mostrar detalles en el panel lateral
    showPhilosopherDetails(philosopher);
    
    // Resaltar marcador
    highlightSelectedMarker(philosopherId);
    
    // Abrir popup
    openPhilosopherPopup(philosopherId);
}

// ===== FUNCIÓN: MOSTRAR DETALLES DEL FILÓSOFO =====
function showPhilosopherDetails(philosopher) {
    const detailsContainer = document.getElementById('philosopher-details');
    if (!detailsContainer) return;
    
    // Crear contenido HTML
    const worksList = philosopher.works && Array.isArray(philosopher.works) 
        ? philosopher.works.map(work => `<li>${work}</li>`).join('')
        : '<li>Obras no especificadas</li>';
    
    const regionColor = CONFIG.regionColors[philosopher.region] || '#3498db';
    const regionName = CONFIG.regionNames[philosopher.region] || philosopher.region;
    
    const detailsHTML = `
        <div class="philosopher-card">
            <div class="philosopher-header">
                <h2 class="philosopher-name" onclick="focusOnPhilosopher(${philosopher.id})" title="Centrar en mapa">
                    <i class="fas fa-map-pin"></i> ${philosopher.name}
                </h2>
                <p class="philosopher-era">${philosopher.era || 'Época no especificada'}</p>
                <span class="philosopher-subcategory">${philosopher.subcategory || 'Categoría no especificada'}</span>
                <span class="region-badge" style="background-color: ${regionColor}">
                    ${regionName}
                </span>
            </div>
            
            <div class="info-section">
                <h3 class="info-title"><i class="fas fa-graduation-cap"></i> Área de la filosofía</h3>
                <p>${philosopher.area || 'No especificada'}</p>
            </div>
            
            <div class="info-section">
                <h3 class="info-title"><i class="fas fa-lightbulb"></i> Conceptos centrales</h3>
                <p>${philosopher.concepts || 'No especificados'}</p>
            </div>
            
            <div class="info-section">
                <h3 class="info-title"><i class="fas fa-book"></i> Obras principales</h3>
                <ul class="works-list">
                    ${worksList}
                </ul>
            </div>
            
            <div class="info-section">
                <h3 class="info-title"><i class="fas fa-map-marker-alt"></i> Ubicación histórica</h3>
                <p>${philosopher.city || 'Ubicación no especificada'}</p>
            </div>
            
            <div class="info-section">
                <button class="view-full-btn" onclick="openDetailedView(${philosopher.id})">
                    <i class="fas fa-expand"></i> Ver vista detallada completa
                </button>
            </div>
        </div>
    `;
    
    detailsContainer.innerHTML = detailsHTML;
}

// ===== FUNCIÓN: RESALTAR MARCADOR SELECCIONADO =====
function highlightSelectedMarker(philosopherId) {
    const philosopher = philosophers.find(p => p.id === philosopherId);
    if (!philosopher) return;
    
    const selectedMarker = markers.find(marker => {
        const latLng = marker.getLatLng();
        return latLng.lat === philosopher.location[0] && 
               latLng.lng === philosopher.location[1];
    });
    
    if (selectedMarker) {
        highlightMarker(selectedMarker);
    }
}

// ===== FUNCIÓN: ABRIR POPUP DEL FILÓSOFO =====
function openPhilosopherPopup(philosopherId) {
    const philosopher = philosophers.find(p => p.id === philosopherId);
    if (!philosopher) return;
    
    const marker = markers.find(m => {
        const latLng = m.getLatLng();
        return latLng.lat === philosopher.location[0] && 
               latLng.lng === philosopher.location[1];
    });
    
    if (marker) {
        marker.openPopup();
    }
}

// ===== FUNCIÓN: FOCUS EN FILÓSOFO =====
function focusOnPhilosopher(philosopherId) {
    const philosopher = philosophers.find(p => p.id === philosopherId);
    if (philosopher) {
        map.setView(philosopher.location, 8, {
            animate: true,
            duration: 1
        });
    }
}

// ===== FUNCIÓN: CONFIGURAR EVENT LISTENERS =====
function setupEventListeners() {
    console.log('🎯 Configurando event listeners...');
    
    // Barra de búsqueda
    const searchInput = document.getElementById('philosopher-search');
    const clearButton = document.getElementById('clear-search');
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.trim();
            handleSearch(searchTerm);
            
            // Mostrar/ocultar botón de limpiar
            if (clearButton) {
                if (searchTerm) {
                    clearButton.classList.add('visible');
                } else {
                    clearButton.classList.remove('visible');
                }
            }
        });
        
        // Buscar al presionar Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch(this.value.trim());
            }
        });
    }
    
    // Botón de limpiar búsqueda
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            searchInput.value = '';
            searchInput.focus();
            handleSearch('');
            clearButton.classList.remove('visible');
        });
    }
    
    // Enlace de fuentes
    const sourceLink = document.getElementById('data-source-link');
    if (sourceLink) {
        sourceLink.addEventListener('click', function(e) {
            e.preventDefault();
            showMethodologyModal();
        });
    }
    
    // Modal
    const modal = document.getElementById('detail-modal');
    const closeModal = document.querySelector('.close-modal');
    
    if (modal && closeModal) {
        closeModal.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        // Cerrar modal al hacer clic fuera
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Cerrar con Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        });
    }
    
    console.log('✅ Event listeners configurados');
}

// ===== FUNCIÓN: MANEJAR BÚSQUEDA =====
function handleSearch(searchTerm) {
    console.log(`🔎 Buscando: "${searchTerm}"`);
    currentSearch = searchTerm.toLowerCase();
    
    // Aplicar filtros combinados
    applyCurrentFilters();
    
    if (!searchTerm) {
        return;
    }
    
    // Filtrar por búsqueda
    markers.forEach(marker => {
        const philosopher = getPhilosopherByMarker(marker);
        if (!philosopher) return;
        
        const matchesSearch = philosopherMatchesSearch(philosopher, searchTerm);
        
        // Mostrar/ocultar según búsqueda
        if (!matchesSearch && map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    
    // Mostrar resultados de búsqueda
    showSearchResults(searchTerm);
}

// ===== FUNCIÓN: VERIFICAR COINCIDENCIA EN BÚSQUEDA =====
function philosopherMatchesSearch(philosopher, searchTerm) {
    const term = searchTerm.toLowerCase();
    
    // Buscar en diferentes campos
    const searchFields = [
        philosopher.name,
        philosopher.area,
        philosopher.concepts,
        philosopher.subcategory,
        philosopher.era,
        philosopher.city,
        philosopher.regionName
    ];
    
    // Buscar en obras
    if (philosopher.works && Array.isArray(philosopher.works)) {
        searchFields.push(...philosopher.works);
    }
    
    return searchFields.some(field => 
        field && field.toString().toLowerCase().includes(term)
    );
}

// ===== FUNCIÓN: APLICAR FILTRO DE BÚSQUEDA =====
function applySearchFilter(searchTerm) {
    if (!searchTerm) return;
    
    markers.forEach(marker => {
        const philosopher = getPhilosopherByMarker(marker);
        if (philosopher && !philosopherMatchesSearch(philosopher, searchTerm)) {
            if (map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        }
    });
}

// ===== FUNCIÓN: MOSTRAR RESULTADOS DE BÚSQUEDA =====
function showSearchResults(searchTerm) {
    const detailsContainer = document.getElementById('philosopher-details');
    const visibleMarkers = markers.filter(marker => map.hasLayer(marker));
    const matchCount = visibleMarkers.length;
    
    if (searchTerm && matchCount === 0) {
        // No hay resultados
        detailsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No se encontraron resultados</h3>
                <p>No hay filósofos que coincidan con "<strong>${searchTerm}</strong>"</p>
                <p>Intenta con otros términos o verifica la ortografía.</p>
                <button onclick="clearSearch()" class="clear-search-btn">
                    <i class="fas fa-times"></i> Limpiar búsqueda
                </button>
            </div>
        `;
    } else if (searchTerm && matchCount === 1) {
        // Un solo resultado, mostrarlo automáticamente
        const visibleMarker = visibleMarkers[0];
        const philosopher = getPhilosopherByMarker(visibleMarker);
        
        if (philosopher) {
            selectPhilosopher(philosopher.id);
        }
    } else if (searchTerm && matchCount > 1) {
        // Múltiples resultados, mostrar lista
        const matchingPhilosophers = visibleMarkers.map(marker => getPhilosopherByMarker(marker));
        
        let resultsHTML = `
            <div class="search-results">
                <h3><i class="fas fa-search"></i> Resultados de búsqueda</h3>
                <p>Se encontraron <strong>${matchCount}</strong> filósofos para "<strong>${searchTerm}</strong>"</p>
                <div class="results-list">
        `;
        
        matchingPhilosophers.forEach(philosopher => {
            if (!philosopher) return;
            
            const regionColor = CONFIG.regionColors[philosopher.region] || '#3498db';
            
            resultsHTML += `
                <div class="result-item" onclick="selectPhilosopher(${philosopher.id})">
                    <div class="result-color" style="background-color: ${regionColor}"></div>
                    <div class="result-content">
                        <h4>${philosopher.name}</h4>
                        <p>${philosopher.era || ''} • ${philosopher.area || ''}</p>
                    </div>
                    <i class="fas fa-chevron-right"></i>
                </div>
            `;
        });
        
        resultsHTML += `
                </div>
                <button onclick="clearSearch()" class="clear-search-btn">
                    <i class="fas fa-times"></i> Limpiar búsqueda
                </button>
            </div>
        `;
        
        detailsContainer.innerHTML = resultsHTML;
    }
}

// ===== FUNCIÓN: LIMPIAR BÚSQUEDA =====
function clearSearch() {
    const searchInput = document.getElementById('philosopher-search');
    const clearButton = document.getElementById('clear-search');
    
    if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
    }
    
    if (clearButton) {
        clearButton.classList.remove('visible');
    }
    
    currentSearch = '';
    handleSearch('');
}

// ===== FUNCIÓN: ACTUALIZAR CONTADOR DE FILÓSOFOS =====
function updatePhilosopherCount() {
    const countElement = document.getElementById('philosopher-count');
    if (countElement) {
        countElement.textContent = philosophers.length;
    }
}

// ===== FUNCIÓN: ACTUALIZAR FECHA ACTUAL =====
function updateCurrentDate() {
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        const now = new Date();
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        dateElement.textContent = now.toLocaleDateString('es-ES', options);
    }
}

// ===== FUNCIÓN: MOSTRAR MODAL DE METODOLOGÍA =====
function showMethodologyModal() {
    const modal = document.getElementById('detail-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    if (!modal || !modalTitle || !modalBody) return;
    
    modalTitle.textContent = 'Fuentes y Metodología';
    
    modalBody.innerHTML = `
        <div class="methodology-content">
            <h3><i class="fas fa-graduation-cap"></i> Criterios de Selección</h3>
            <p>Los filósofos incluidos en este atlas cumplen con los siguientes criterios:</p>
            <ul>
                <li><strong>Rigor académico:</strong> Información verificada por consenso académico</li>
                <li><strong>Producción escrita:</strong> Haber escrito al menos una obra filosófica significativa</li>
                <li><strong>Influencia documentada:</strong> Contribuciones reconocidas en historias especializadas</li>
                <li><strong>Contextualización histórica:</strong> Ubicación en región cultural/política histórica</li>
            </ul>
            
            <h3><i class="fas fa-map-marked-alt"></i> Criterios Geográficos</h3>
            <p>Se utiliza la <strong>región cultural o política histórica</strong>, no el concepto moderno de "nación".</p>
            <p>Ejemplos:</p>
            <ul>
                <li>Al-Ándalus para pensadores islámicos en la península ibérica medieval</li>
                <li>Estados Italianos para el Renacimiento italiano</li>
                <li>Imperio Habsburgo para Europa Central pre-nacional</li>
            </ul>
            
            <h3><i class="fas fa-book"></i> Fuentes Principales</h3>
            <ul>
                <li>Stanford Encyclopedia of Philosophy</li>
                <li>Routledge Encyclopedia of Philosophy</li>
                <li>Historias especializadas por período y región</li>
                <li>Bibliografías académicas verificadas</li>
            </ul>
            
            <h3><i class="fas fa-exclamation-triangle"></i> Limitaciones</h3>
            <p>Este es un proyecto en constante desarrollo. Algunas limitaciones incluyen:</p>
            <ul>
                <li>Cobertura inicial centrada en Europa Occidental</li>
                <li>Proceso de verificación manual de cada entrada</li>
                <li>Representación limitada de filósofas (en proceso de expansión)</li>
            </ul>
            
            <div class="methodology-footer">
                <p><i class="fas fa-sync-alt"></i> <strong>Actualizaciones:</strong> La base de datos se actualiza periódicamente con nuevas verificaciones.</p>
                <p><i class="fas fa-envelope"></i> <strong>Sugerencias:</strong> Para correcciones o sugerencias, consultar el repositorio del proyecto.</p>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// ===== FUNCIÓN: ABRIR VISTA DETALLADA =====
function openDetailedView(philosopherId) {
    const philosopher = philosophers.find(p => p.id === philosopherId);
    if (!philosopher) return;
    
    const modal = document.getElementById('detail-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    if (!modal || !modalTitle || !modalBody) return;
    
    modalTitle.textContent = philosopher.name;
    
    const worksList = philosopher.works && Array.isArray(philosopher.works) 
        ? philosopher.works.map(work => `<li>${work}</li>`).join('')
        : '<li>Obras no especificadas</li>';
    
    const regionColor = CONFIG.regionColors[philosopher.region] || '#3498db';
    const regionName = CONFIG.regionNames[philosopher.region] || philosopher.region;
    
    modalBody.innerHTML = `
        <div class="detailed-view">
            <div class="philosopher-header-modal" style="background: linear-gradient(135deg, ${regionColor}, ${regionColor}99)">
                <div class="header-content">
                    <h2>${philosopher.name}</h2>
                    <p class="philosopher-era-modal">${philosopher.era || 'Época no especificada'}</p>
                    <div class="badges">
                        <span class="badge region">${regionName}</span>
                        <span class="badge subcategory">${philosopher.subcategory || 'Categoría no especificada'}</span>
                    </div>
                    <p class="location"><i class="fas fa-map-marker-alt"></i> ${philosopher.city || 'Ubicación no especificada'}</p>
                </div>
            </div>
            
            <div class="modal-sections">
                <section>
                    <h3><i class="fas fa-graduation-cap"></i> Área de la filosofía</h3>
                    <p>${philosopher.area || 'No especificada'}</p>
                </section>
                
                <section>
                    <h3><i class="fas fa-lightbulb"></i> Conceptos centrales</h3>
                    <p>${philosopher.concepts || 'No especificados'}</p>
                </section>
                
                <section>
                    <h3><i class="fas fa-book"></i> Obras principales</h3>
                    <ul>
                        ${worksList}
                    </ul>
                </section>
                
                <section>
                    <h3><i class="fas fa-history"></i> Contexto histórico</h3>
                    <p>${philosopher.subcategory || 'Contexto no especificado'}. ${philosopher.city || ''}</p>
                </section>
                
                <section>
                    <h3><i class="fas fa-chart-line"></i> Influencia y legado</h3>
                    <p>Información de influencia y recepción histórica (en desarrollo para todos los filósofos).</p>
                </section>
            </div>
            
            <div class="modal-actions">
                <button onclick="focusOnPhilosopher(${philosopher.id})" class="action-btn">
                    <i class="fas fa-map-pin"></i> Centrar en mapa
                </button>
                <button onclick="sharePhilosopher(${philosopher.id})" class="action-btn">
                    <i class="fas fa-share-alt"></i> Compartir
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// ===== FUNCIÓN: COMPARTIR FILÓSOFO =====
function sharePhilosopher(philosopherId) {
    const philosopher = philosophers.find(p => p.id === philosopherId);
    if (!philosopher) return;
    
    const text = `Conoce a ${philosopher.name} en el Atlas Filosófico Europeo: ${philosopher.area}. ${window.location.href}?philosopher=${philosopherId}`;
    
    if (navigator.share) {
        navigator.share({
            title: philosopher.name,
            text: text,
            url: window.location.href
        });
    } else {
        // Copiar al portapapeles como fallback
        navigator.clipboard.writeText(text).then(() => {
            alert('Enlace copiado al portapapeles');
        });
    }
}

// ===== FUNCIÓN: MOSTRAR ERROR =====
function showError(message) {
    const detailsContainer = document.getElementById('philosopher-details');
    if (detailsContainer) {
        detailsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()">Reintentar</button>
            </div>
        `;
    }
    
    console.error('Error en la aplicación:', message);
}

// ===== FUNCIÓN: LIMPIAR SELECCIÓN DE FILÓSOFO =====
function clearPhilosopherSelection() {
    selectedPhilosopherId = null;
    
    // Restaurar vista introductoria
    const detailsContainer = document.getElementById('philosopher-details');
    if (detailsContainer) {
        detailsContainer.innerHTML = `
            <div class="intro-panel">
                <div class="intro-icon">
                    <i class="fas fa-compass"></i>
                </div>
                <h2>Bienvenido al Atlas Filosófico</h2>
                <p class="intro-text">
                    Este mapa interactivo presenta una selección rigurosa de filósofos europeos 
                    más allá de las figuras canónicas más difundidas. Cada marcador representa 
                    un pensador con contribuciones documentadas y verificadas.
                </p>
                <div class="instructions">
                    <h4><i class="fas fa-info-circle"></i> Cómo usar:</h4>
                    <ul>
                        <li><strong>Haz clic</strong> en cualquier marcador del mapa para ver detalles</li>
                        <li><strong>Filtra</strong> por región o época usando los botones</li>
                        <li><strong>Busca</strong> términos específicos en la barra de búsqueda</li>
                        <li><strong>Haz clic en el título</strong> de cualquier filósofo para centrar el mapa</li>
                    </ul>
                </div>
                <div class="methodology-note">
                    <h4><i class="fas fa-exclamation-circle"></i> Nota metodológica:</h4>
                    <p>Se utiliza la <strong>región cultural o política histórica</strong> (no el concepto 
                    moderno de "nación") para una ubicación precisa. Todos los filósofos incluidos 
                    cumplen con el criterio de haber producido obras filosóficas significativas 
                    confirmadas por consenso académico.</p>
                </div>
            </div>
        `;
    }
}

// ===== FUNCIONES GLOBALES PARA HTML =====
// Estas funciones son accesibles desde HTML
window.selectPhilosopher = selectPhilosopher;
window.selectPhilosopherFromPopup = selectPhilosopher;
window.focusOnPhilosopher = focusOnPhilosopher;
window.openDetailedView = openDetailedView;
window.clearSearch = clearSearch;
window.sharePhilosopher = sharePhilosopher;

// ===== DATOS DE EJEMPLO (para desarrollo) =====
function getSampleData() {
    return [
        {
            "id": 1,
            "name": "Abu al-Walid Muhammad ibn Ahmad ibn Rushd (Averroes)",
            "region": "espana",
            "regionName": "España (Mundo islámico / Al-Ándalus)",
            "subcategory": "Edad Media (Edad de Oro del Islam, c. Siglos X-XII)",
            "era": "1126 - 1198",
            "area": "Filosofía y teología islámica, aristotelismo",
            "concepts": "Relación entre fe y razón, la eternidad del mundo, el intelecto agente",
            "works": [
                "Comentarios a Aristóteles (De anima, Metaphysica, etc.)",
                "La destrucción de la destrucción (Tahafut al-Tahafut)",
                "Discurso decisivo (Faṣl al-Maqāl)"
            ],
            "location": [37.8882, -4.7794],
            "city": "Nacido en Córdoba (Califato Omeya de Córdoba)",
            "color": "#3498db"
        },
        {
            "id": 2,
            "name": "Domingo de Soto",
            "region": "espana",
            "regionName": "España",
            "subcategory": "Escolástica Renacentista (Siglo XVI)",
            "era": "1494 - 1560",
            "area": "Filosofía natural, lógica y derecho (Escuela de Salamanca)",
            "concepts": "Movimiento de caída libre (dinámica pre-galileana), teoría de la guerra justa, ius gentium",
            "works": [
                "Deliberación sobre la causa de los pobres (1545)",
                "Comentario a la Física de Aristóteles (1545)",
                "De iustitia et iure (1553)"
            ],
            "location": [40.9429, -4.1088],
            "city": "Segovia",
            "color": "#3498db"
        }
    ];
}

// ===== INICIALIZACIÓN AL CARGAR =====
console.log('📚 Atlas Filosófico Europeo - Script cargado');