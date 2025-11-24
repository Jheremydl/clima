// Configuración de la API (debes reemplazar con tu propia API key)
const API_KEY = '72f040bb6418a103d5cf264b047ae2ce'; // Obtén tu API key gratis en https://openweathermap.org/api
const API_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Elementos del DOM
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const weatherDisplay = document.getElementById('weatherDisplay');

// Elementos de navegación
const navLinks = document.querySelectorAll('.nav-link');
const homeSection = document.getElementById('homeSection');
const mainContent = document.getElementById('mainContent');
const mapsSection = document.getElementById('mapsSection');
const alertsSection = document.getElementById('alertsSection');

// Variables globales
let weatherMap = null;
let currentLayer = 'temp';
let currentCoords = { lat: 14.6349, lon: -90.5069 }; // Guatemala por defecto

// Mapeo de iconos del clima
const weatherIcons = {
    '01d': 'fa-sun',
    '01n': 'fa-moon',
    '02d': 'fa-cloud-sun',
    '02n': 'fa-cloud-moon',
    '03d': 'fa-cloud',
    '03n': 'fa-cloud',
    '04d': 'fa-cloud',
    '04n': 'fa-cloud',
    '09d': 'fa-cloud-rain',
    '09n': 'fa-cloud-rain',
    '10d': 'fa-cloud-sun-rain',
    '10n': 'fa-cloud-moon-rain',
    '11d': 'fa-cloud-bolt',
    '11n': 'fa-cloud-bolt',
    '13d': 'fa-snowflake',
    '13n': 'fa-snowflake',
    '50d': 'fa-smog',
    '50n': 'fa-smog'
};

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherByCity(city);
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            getWeatherByCity(city);
        }
    }
});

locationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                getWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                showError('No se pudo obtener tu ubicación. Por favor, permite el acceso a la ubicación.');
            }
        );
    } else {
        showError('Tu navegador no soporta geolocalización.');
    }
});

// Función para mostrar loading
function showLoading() {
    loadingSpinner.classList.remove('hidden');
    errorMessage.classList.add('hidden');
    weatherDisplay.classList.add('hidden');
}

// Función para mostrar error
function showError(message) {
    loadingSpinner.classList.add('hidden');
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    weatherDisplay.classList.add('hidden');
}

// Función para obtener clima por nombre de ciudad
async function getWeatherByCity(city) {
    showLoading();
    
    try {
        const response = await fetch(
            `${API_BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric&lang=es`
        );
        
        if (!response.ok) {
            throw new Error('Ciudad no encontrada');
        }
        
        const data = await response.json();
        await getForecastData(data.coord.lat, data.coord.lon);
        displayWeather(data);
    } catch (error) {
        showError('No se pudo encontrar la ciudad. Por favor, verifica el nombre e intenta nuevamente.');
    }
}

// Función para obtener clima por coordenadas
async function getWeatherByCoords(lat, lon) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`
        );
        
        if (!response.ok) {
            throw new Error('Error al obtener datos del clima');
        }
        
        const data = await response.json();
        await getForecastData(lat, lon);
        displayWeather(data);
    } catch (error) {
        showError('Error al obtener los datos del clima. Por favor, intenta nuevamente.');
    }
}

// Función para obtener pronóstico
async function getForecastData(lat, lon) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`
        );
        
        if (!response.ok) {
            throw new Error('Error al obtener pronóstico');
        }
        
        const data = await response.json();
        displayHourlyForecast(data.list.slice(0, 8));
        displayDailyForecast(data.list);
    } catch (error) {
        console.error('Error al cargar pronóstico:', error);
    }
}

// Función para mostrar clima actual
function displayWeather(data) {
    loadingSpinner.classList.add('hidden');
    errorMessage.classList.add('hidden');
    weatherDisplay.classList.remove('hidden');
    
    // Información de ubicación
    document.getElementById('cityName').textContent = `${data.name}, ${data.sys.country}`;
    document.getElementById('currentDate').textContent = formatDate(new Date());
    
    // Temperatura y condiciones
    const weatherIcon = document.getElementById('weatherIcon');
    weatherIcon.className = `fas ${weatherIcons[data.weather[0].icon] || 'fa-cloud'}`;
    
    document.getElementById('temperature').textContent = `${Math.round(data.main.temp)}°C`;
    document.getElementById('weatherDescription').textContent = data.weather[0].description;
    
    // Detalles del clima
    document.getElementById('feelsLike').textContent = `${Math.round(data.main.feels_like)}°C`;
    document.getElementById('humidity').textContent = `${data.main.humidity}%`;
    document.getElementById('windSpeed').textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    document.getElementById('pressure').textContent = `${data.main.pressure} hPa`;
    document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
    document.getElementById('cloudiness').textContent = `${data.clouds.all}%`;
    
    // Amanecer y atardecer
    document.getElementById('sunrise').textContent = formatTime(new Date(data.sys.sunrise * 1000));
    document.getElementById('sunset').textContent = formatTime(new Date(data.sys.sunset * 1000));
}

// Función para mostrar pronóstico por hora
function displayHourlyForecast(hourlyData) {
    const hourlyForecast = document.getElementById('hourlyForecast');
    hourlyForecast.innerHTML = '';
    
    hourlyData.forEach(hour => {
        const hourItem = document.createElement('div');
        hourItem.className = 'hourly-item';
        
        const time = new Date(hour.dt * 1000);
        const iconClass = weatherIcons[hour.weather[0].icon] || 'fa-cloud';
        
        hourItem.innerHTML = `
            <div class="hourly-time">${formatTime(time)}</div>
            <i class="fas ${iconClass} hourly-icon"></i>
            <div class="hourly-temp">${Math.round(hour.main.temp)}°C</div>
        `;
        
        hourlyForecast.appendChild(hourItem);
    });
}

// Función para mostrar pronóstico diario
function displayDailyForecast(forecastData) {
    const dailyForecast = document.getElementById('dailyForecast');
    dailyForecast.innerHTML = '';
    
    // Agrupar por día
    const dailyData = {};
    forecastData.forEach(item => {
        const date = new Date(item.dt * 1000).toLocaleDateString('es', { weekday: 'long', month: 'short', day: 'numeric' });
        if (!dailyData[date]) {
            dailyData[date] = {
                temps: [],
                icons: [],
                date: new Date(item.dt * 1000)
            };
        }
        dailyData[date].temps.push(item.main.temp);
        dailyData[date].icons.push(item.weather[0].icon);
    });
    
    // Mostrar primeros 7 días
    Object.entries(dailyData).slice(0, 7).forEach(([date, data]) => {
        const maxTemp = Math.round(Math.max(...data.temps));
        const minTemp = Math.round(Math.min(...data.temps));
        const mostCommonIcon = data.icons[0];
        const iconClass = weatherIcons[mostCommonIcon] || 'fa-cloud';
        
        const dayItem = document.createElement('div');
        dayItem.className = 'daily-item';
        
        dayItem.innerHTML = `
            <div class="daily-day">${date}</div>
            <i class="fas ${iconClass} daily-icon"></i>
            <div class="daily-temps">
                <span class="temp-max">${maxTemp}°C</span>
                <span class="temp-min">${minTemp}°C</span>
            </div>
        `;
        
        dailyForecast.appendChild(dayItem);
    });
}

// Funciones auxiliares
function formatDate(date) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return date.toLocaleDateString('es', options);
}

function formatTime(date) {
    return date.toLocaleTimeString('es', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Cargar clima de ciudad por defecto al iniciar (opcional)
window.addEventListener('load', () => {
    // Puedes descomentar esta línea para cargar una ciudad por defecto
    // getWeatherByCity('Madrid');
    initializeMap();
    loadAlerts();
});

// ============================================
// NAVEGACIÓN ENTRE SECCIONES
// ============================================

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = link.dataset.section;
        
        // Actualizar links activos
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Mostrar/ocultar secciones
        if (section === 'home') {
            homeSection.classList.remove('hidden');
            mainContent.classList.remove('hidden');
            mapsSection.classList.add('hidden');
            alertsSection.classList.add('hidden');
        } else if (section === 'maps') {
            homeSection.classList.add('hidden');
            mainContent.classList.add('hidden');
            mapsSection.classList.remove('hidden');
            alertsSection.classList.add('hidden');
            
            // Inicializar mapa si no existe
            setTimeout(() => {
                if (weatherMap) {
                    weatherMap.invalidateSize();
                } else {
                    initializeMap();
                }
            }, 100);
        } else if (section === 'alerts') {
            homeSection.classList.add('hidden');
            mainContent.classList.add('hidden');
            mapsSection.classList.add('hidden');
            alertsSection.classList.remove('hidden');
        }
        
        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

// ============================================
// SISTEMA DE MAPAS
// ============================================

function initializeMap() {
    if (!weatherMap) {
        // Crear mapa centrado en Guatemala
        weatherMap = L.map('weatherMap').setView([currentCoords.lat, currentCoords.lon], 7);
        
        // Agregar capa base
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(weatherMap);
        
        // Agregar capa de temperatura por defecto
        updateMapLayer('temp');
    }
}

function updateMapLayer(layer) {
    currentLayer = layer;
    
    // Remover capas anteriores
    weatherMap.eachLayer((layer) => {
        if (layer instanceof L.TileLayer && !layer._url.includes('openstreetmap')) {
            weatherMap.removeLayer(layer);
        }
    });
    
    // Mapeo de capas
    const layerMap = {
        'temp': 'temp_new',
        'precipitation': 'precipitation_new',
        'wind': 'wind_new',
        'clouds': 'clouds_new',
        'pressure': 'pressure_new'
    };
    
    const legendTitles = {
        'temp': 'Temperatura (°C)',
        'precipitation': 'Precipitación (mm)',
        'wind': 'Velocidad del Viento (m/s)',
        'clouds': 'Nubosidad (%)',
        'pressure': 'Presión Atmosférica (hPa)'
    };
    
    const legendClasses = {
        'temp': 'temp-gradient',
        'precipitation': 'precip-gradient',
        'wind': 'wind-gradient',
        'clouds': 'clouds-gradient',
        'pressure': 'pressure-gradient'
    };
    
    // Agregar nueva capa
    const weatherLayer = L.tileLayer(
        `https://tile.openweathermap.org/map/${layerMap[layer]}/{z}/{x}/{y}.png?appid=${API_KEY}`,
        {
            attribution: 'Weather data © OpenWeatherMap',
            opacity: 0.6
        }
    );
    
    weatherLayer.addTo(weatherMap);
    
    // Actualizar leyenda
    document.getElementById('legendTitle').textContent = legendTitles[layer];
    const legendContent = document.getElementById('legendContent');
    legendContent.className = 'legend-gradient ' + legendClasses[layer];
}

// Event listeners para botones de mapa
document.querySelectorAll('.map-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.map-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateMapLayer(btn.dataset.layer);
    });
});

// ============================================
// SISTEMA DE ALERTAS
// ============================================

// Alertas de ejemplo (en producción vendrían de una API)
const mockAlerts = [
    {
        id: 1,
        title: 'Tormenta Eléctrica Severa',
        location: 'Ciudad de Guatemala',
        description: 'Se esperan tormentas eléctricas severas con vientos de hasta 80 km/h y posibilidad de granizo. Se recomienda permanecer en lugares seguros.',
        severity: 'severe',
        time: '2 horas',
        icon: 'fa-cloud-bolt'
    },
    {
        id: 2,
        title: 'Alerta de Calor Extremo',
        location: 'Escuintla',
        description: 'Temperaturas superiores a 38°C. Se recomienda mantenerse hidratado y evitar la exposición prolongada al sol.',
        severity: 'moderate',
        time: '5 horas',
        icon: 'fa-temperature-high'
    },
    {
        id: 3,
        title: 'Vientos Fuertes',
        location: 'Quetzaltenango',
        description: 'Vientos sostenidos de 40-60 km/h. Precaución con objetos sueltos y árboles.',
        severity: 'moderate',
        time: '1 hora',
        icon: 'fa-wind'
    },
    {
        id: 4,
        title: 'Neblina Densa',
        location: 'Alta Verapaz',
        description: 'Visibilidad reducida a menos de 100 metros. Conducir con precaución.',
        severity: 'minor',
        time: '30 minutos',
        icon: 'fa-smog'
    },
    {
        id: 5,
        title: 'Lluvia Intensa',
        location: 'Petén',
        description: 'Precipitaciones intensas de 50-80mm. Posibles inundaciones en zonas bajas.',
        severity: 'severe',
        time: '3 horas',
        icon: 'fa-cloud-showers-heavy'
    },
    {
        id: 6,
        title: 'Alerta UV Alta',
        location: 'Costa Sur',
        description: 'Índice UV extremadamente alto. Use protector solar y evite exposición entre 10am-4pm.',
        severity: 'minor',
        time: '8 horas',
        icon: 'fa-sun'
    }
];

function loadAlerts() {
    displayAlerts(mockAlerts);
}

function displayAlerts(alerts) {
    const alertsGrid = document.getElementById('alertsGrid');
    
    if (alerts.length === 0) {
        alertsGrid.innerHTML = `
            <div class="no-alerts">
                <i class="fas fa-circle-check"></i>
                <h3>No hay alertas activas</h3>
                <p>No se han emitido alertas meteorológicas para tu región en este momento.</p>
            </div>
        `;
        return;
    }
    
    alertsGrid.innerHTML = alerts.map(alert => `
        <div class="alert-card ${alert.severity}" data-severity="${alert.severity}">
            <div class="alert-header">
                <div class="alert-icon-wrapper">
                    <i class="fas ${alert.icon}"></i>
                </div>
                <div class="alert-title">
                    <h3>${alert.title}</h3>
                    <div class="alert-location">
                        <i class="fas fa-location-dot"></i>
                        ${alert.location}
                    </div>
                </div>
            </div>
            <p class="alert-description">${alert.description}</p>
            <div class="alert-meta">
                <div class="alert-time">
                    <i class="fas fa-clock"></i>
                    Hace ${alert.time}
                </div>
                <span class="alert-severity-badge">${
                    alert.severity === 'severe' ? 'Severa' :
                    alert.severity === 'moderate' ? 'Moderada' : 'Menor'
                }</span>
            </div>
        </div>
    `).join('');
}

// Event listeners para filtros de alertas
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.dataset.filter;
        
        if (filter === 'all') {
            displayAlerts(mockAlerts);
        } else {
            const filtered = mockAlerts.filter(alert => alert.severity === filter);
            displayAlerts(filtered);
        }
    });
});