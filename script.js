// Конфигурация
const API_KEY = '13aa892bb472ea7a1b70affef77e10f9'; // Получите на openweathermap.org
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
};

// Состояние приложения
const state = {
  currentCity: 'Москва',
  recentCities: [],
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  // Загружаем последний город из localStorage
  const savedCity = localStorage.getItem('lastCity');
  if (savedCity) {
    state.currentCity = savedCity;
    elements.cityInput.value = savedCity;
  }

  // Загружаем историю городов
  loadRecentCities();

  // Получаем погоду для текущего города
  fetchWeather(state.currentCity);

  // Обработчики событий
  elements.searchBtn.addEventListener('click', () => {
    const city = elements.cityInput.value.trim();
    if (city) {
      fetchWeather(city);
    }
  });

  elements.cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const city = elements.cityInput.value.trim();
      if (city) {
        fetchWeather(city);
      }
    }
  });
});

// Основная функция получения погоды
async function fetchWeather(city) {
  try {
    // Показываем индикатор загрузки
    showLoading();

    // Формируем URL запроса
    const url = `${BASE_URL}?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}&lang=ru`;

    // Отправляем запрос
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Город не найден');
    }

    // Парсим ответ
    const data = await response.json();

    // Обновляем состояние
    state.currentCity = city;

    // Сохраняем в localStorage
    localStorage.setItem('lastCity', city);

    // Добавляем в историю
    addToRecentCities(city);

    // Обновляем интерфейс
    updateWeatherDisplay(data);

    // Показываем карточку
    showWeatherCard();
  } catch (error) {
    // Показываем ошибку
    showError();
    console.error('Ошибка при получении погоды:', error);
  }
}

// Функция обновления интерфейса с данными о погоде
function updateWeatherDisplay(data) {
  // Обновляем основные данные
  elements.cityName.textContent = data.name + ', ' + data.sys.country;
  elements.tempValue.textContent = Math.round(data.main.temp);
  elements.weatherDescription.textContent = data.weather[0].description;
  elements.feelsLike.textContent = Math.round(data.main.feels_like) + '°C';
  elements.humidity.textContent = data.main.humidity + '%';
  elements.windSpeed.textContent = data.wind.speed + ' м/с';
  elements.pressure.textContent = data.main.pressure + ' гПа';

  // Устанавливаем иконку
  const iconCode = data.weather[0].icon;
  elements.weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  elements.weatherIcon.alt = data.weather[0].description;

  // Обновляем дату
  updateCurrentDate();
}

// Вспомогательные функции
function showLoading() {
  elements.loading.style.display = 'block';
  elements.weatherCard.style.display = 'none';
  elements.errorMessage.style.display = 'none';
}

function showWeatherCard() {
  elements.loading.style.display = 'none';
  elements.weatherCard.style.display = 'block';
  elements.errorMessage.style.display = 'none';
}

function showError() {
  elements.loading.style.display = 'none';
  elements.weatherCard.style.display = 'none';
  elements.errorMessage.style.display = 'block';
}

function updateCurrentDate() {
  const now = new Date();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  elements.currentDate.textContent = now.toLocaleDateString('ru-RU', options);
}

function addToRecentCities(city) {
  // Добавляем город в начало массива
  state.recentCities = [
    city,
    ...state.recentCities.filter((c) => c !== city),
  ].slice(0, 5);

  // Сохраняем в localStorage
  localStorage.setItem('recentCities', JSON.stringify(state.recentCities));

  // Обновляем отображение
  updateRecentCitiesDisplay();
}

function loadRecentCities() {
  const saved = localStorage.getItem('recentCities');
  if (saved) {
    state.recentCities = JSON.parse(saved);
    updateRecentCitiesDisplay();
  }
}

function updateRecentCitiesDisplay() {
  elements.recentCities.innerHTML = '';

  state.recentCities.forEach((city) => {
    const cityElement = document.createElement('div');
    cityElement.className = 'city-chip';
    cityElement.textContent = city;
    cityElement.addEventListener('click', () => {
      elements.cityInput.value = city;
      fetchWeather(city);
    });
    elements.recentCities.appendChild(cityElement);
  });
}
