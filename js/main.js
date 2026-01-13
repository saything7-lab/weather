// Конфигурация
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Элементы DOM
const elements = {
  cityInput: document.getElementById('city-input'),
  searchBtn: document.getElementById('search-btn'),
  weatherCard: document.getElementById('weather-card'),
  loading: document.getElementById('loading'),
  errorMessage: document.getElementById('error-message'),
  cityName: document.getElementById('city-name'),
  currentDate: document.getElementById('current-date'),
  tempValue: document.getElementById('temp-value'),
  weatherIcon: document.getElementById('weather-icon'),
  weatherDescription: document.getElementById('weather-description'),
  feelsLike: document.getElementById('feels-like'),
  humidity: document.getElementById('humidity'),
  windSpeed: document.getElementById('wind-speed'),
  pressure: document.getElementById('pressure'),
  recentCities: document.getElementById('recent-cities'),
  clearInputBtn: null,
  refreshBtn: document.getElementById('refresh-btn'),
  weatherForecast: document.getElementById('weather-forecast'),
  forecastToggle: document.querySelector('.forecast-toggle'),
};

// Состояние приложения
const state = {
  currentCity: 'Москва',
  recentCities: [],
  currentForecastDays: 1,
  forecastData: null,
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  preventTextSelection();
  const savedCity = localStorage.getItem('lastCity');
  if (savedCity) {
    state.currentCity = savedCity;
    elements.cityInput.value = savedCity;
  }

  loadRecentCities();
  fetchWeather(state.currentCity);

  // Обработчики событий
  elements.searchBtn.addEventListener('click', () => {
    const city = elements.cityInput.value.trim();
    if (city) fetchWeather(city);
  });

  elements.cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const city = elements.cityInput.value.trim();
      if (city) fetchWeather(city);
    }
  });

  elements.clearInputBtn = document.getElementById('clear-input');
  if (elements.clearInputBtn) {
    elements.clearInputBtn.addEventListener('click', () => {
      elements.cityInput.value = '';
      elements.cityInput.focus();
      elements.clearInputBtn.style.transform = 'scale(0.8)';
      setTimeout(() => {
        elements.clearInputBtn.style.transform = 'scale(1)';
      }, 200);
    });
  }

  if (elements.refreshBtn) {
    elements.refreshBtn.addEventListener('click', () => {
      if (state.currentCity) {
        elements.refreshBtn.classList.add('loading');
        fetchWeather(state.currentCity);
        setTimeout(() => {
          elements.refreshBtn.classList.remove('loading');
          elements.refreshBtn.classList.add('success', 'pulse');
          setTimeout(() => {
            elements.refreshBtn.classList.remove('success', 'pulse');
          }, 2000);
        }, 1000);
      }
    });
  }

  if (elements.forecastToggle) {
    elements.forecastToggle.addEventListener('click', (e) => {
      if (e.target.classList.contains('forecast-btn')) {
        const days = parseInt(e.target.dataset.days);
        toggleForecast(days);
      }
    });
  }
});

// Основная функция получения погоды
async function fetchWeather(city) {
  const forbiddenNames = [
    'россия', 'russia', 'ru', 'rf',
    'сша', 'usa', 'united states', 'us',
    'китай', 'china', 'cn',
    'германия', 'germany', 'de',
    'франция', 'france', 'fr',
    'испания', 'spain', 'es',
    'италия', 'italy', 'it',
  ];

  const normalizedCity = city.toLowerCase().trim();

  if (forbiddenNames.includes(normalizedCity)) {
    alert('⚠️ Пожалуйста, введите название ГОРОДА (например: Москва, Нью-Йорк), а не страны.');
    hideLoading();
    if (elements.refreshBtn) elements.refreshBtn.classList.remove('loading');
    return;
  }

  if (city.length < 2 || normalizedCity === 'город') {
    alert('⚠️ Пожалуйста, введите более конкретное название города.');
    hideLoading();
    if (elements.refreshBtn) elements.refreshBtn.classList.remove('loading');
    return;
  }

  if (elements.weatherCard) {
    elements.weatherCard.style.display = 'none';
    elements.weatherCard.classList.remove('show');
  }

  try {
    showLoading();
    const url = `${BASE_URL}?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}&lang=ru`;
    const response = await fetch(url);

    if (!response.ok) throw new Error('Город не найден');

    const data = await response.json();
    state.currentCity = data.name;
    localStorage.setItem('lastCity', data.name);
    addToRecentCities(data);
    updateWeatherDisplay(data);

    if (state.currentForecastDays > 1) {
      fetchWeatherForecast(city, state.currentForecastDays);
    } else {
      showWeatherCard();
    }

  } catch (error) {
    showError();
    console.error('Ошибка:', error);
  }
}
