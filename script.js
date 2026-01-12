// Конфигурация
const API_KEY = '13aa892bb472ea7a1b70affef77e10f9';
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

// Функция обновления интерфейса с данными о погоде
function updateWeatherDisplay(data) {
  const cityName = data.name;
  const country = data.sys.country;
  const temp = Math.round(data.main.temp);
  const description = data.weather[0].description;
  const iconCode = data.weather[0].icon;
  const feelsLike = Math.round(data.main.feels_like);
  const humidity = data.main.humidity;
  const windSpeed = data.wind.speed;
  const pressure = data.main.pressure;

  elements.cityName.textContent = `${cityName}, ${country}`;
  elements.tempValue.textContent = temp;

  const weatherEmoji = getWeatherIcon(iconCode, description);

  let weatherEmojiContainer = document.querySelector('.weather-emoji-container');
  let weatherDescriptionContainer = document.querySelector('.weather-description-container');

  if (!weatherEmojiContainer) {
    weatherEmojiContainer = document.createElement('div');
    weatherEmojiContainer.className = 'weather-emoji-container';
    weatherDescriptionContainer = document.createElement('div');
    weatherDescriptionContainer.className = 'weather-description-container';

    const tempElement = document.querySelector('.temperature');
    if (tempElement && tempElement.parentNode) {
      const weatherInfoContainer = document.createElement('div');
      weatherInfoContainer.className = 'weather-info-container';
      weatherInfoContainer.appendChild(weatherEmojiContainer);
      weatherInfoContainer.appendChild(weatherDescriptionContainer);
      tempElement.parentNode.insertBefore(weatherInfoContainer, tempElement.nextSibling);
    }
  }

  weatherEmojiContainer.innerHTML = `<span class="weather-main-emoji">${weatherEmoji}</span>`;
  const capitalizedDescription = description.charAt(0).toUpperCase() + description.slice(1);
  weatherDescriptionContainer.innerHTML = `<div class="weather-main-description">${capitalizedDescription}</div>`;

  if (elements.weatherIcon) {
    elements.weatherIcon.style.display = 'none';
  }

  elements.feelsLike.textContent = feelsLike + '°C';
  elements.humidity.textContent = humidity + '%';
  elements.windSpeed.textContent = windSpeed + ' м/с';
  elements.pressure.textContent = pressure + ' гПа';

  updateCurrentDate();
}

// Вспомогательные функции
function showLoading() {
  if (elements.loading) elements.loading.style.display = 'block';
  if (elements.weatherCard) elements.weatherCard.style.display = 'none';
  if (elements.weatherForecast) elements.weatherForecast.classList.remove('show');
  if (elements.errorMessage) elements.errorMessage.style.display = 'none';
}

function showWeatherCard() {
  if (elements.loading) elements.loading.style.display = 'none';
  if (elements.errorMessage) elements.errorMessage.style.display = 'none';
  if (elements.weatherForecast) {
    elements.weatherForecast.style.display = 'none';
    elements.weatherForecast.classList.remove('show');
    elements.weatherForecast.innerHTML = '';
  }
  if (elements.weatherCard) {
    elements.weatherCard.style.display = 'block';
    setTimeout(() => {
      elements.weatherCard.classList.add('show');
      setTimeout(() => {
        if (elements.weatherCard) {
          elements.weatherCard.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 300);
    }, 50);
  }
}

function showForecast() {
  if (elements.weatherCard) {
    elements.weatherCard.style.display = 'none';
    elements.weatherCard.classList.remove('show');
  }
  if (elements.weatherForecast) {
    elements.weatherForecast.style.display = 'block';
    setTimeout(() => {
      elements.weatherForecast.classList.add('show');
      setTimeout(() => {
        if (elements.weatherForecast) {
          elements.weatherForecast.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 300);
    }, 50);
  }
  if (elements.loading) elements.loading.style.display = 'none';
  if (elements.errorMessage) elements.errorMessage.style.display = 'none';
}

function showError() {
  if (elements.loading) elements.loading.style.display = 'none';
  if (elements.weatherCard) {
    elements.weatherCard.style.display = 'none';
    elements.weatherCard.classList.remove('show');
  }
  if (elements.errorMessage) elements.errorMessage.style.display = 'block';
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

function hideLoading() {
  if (elements.loading) elements.loading.style.display = 'none';
  if (elements.refreshBtn) elements.refreshBtn.classList.remove('loading');
}

// Функции для истории городов
function addToRecentCities(weatherData) {
  if (!weatherData || !weatherData.name) return;

  const cityEntry = {
    name: weatherData.name,
    icon: weatherData.weather?.[0]?.icon || '01d',
    temp: Math.round(weatherData.main?.temp || 0),
    description: weatherData.weather?.[0]?.description || '',
  };

  state.recentCities = state.recentCities.filter(
      (item) => item.name && cityEntry.name &&
          item.name.toLowerCase() !== cityEntry.name.toLowerCase()
  );

  state.recentCities.unshift(cityEntry);
  if (state.recentCities.length > 5) state.recentCities = state.recentCities.slice(0, 5);
  localStorage.setItem('recentCities', JSON.stringify(state.recentCities));
  updateRecentCitiesDisplay();
}

function updateRecentCitiesDisplay() {
  const citiesList = document.querySelector('.recent-cities-list');
  if (!citiesList) return;

  const recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
  if (recentCities.length === 0) {
    citiesList.innerHTML = '<div class="empty-history">История поиска пуста</div>';
    return;
  }

  citiesList.innerHTML = '';
  recentCities.forEach((city, index) => {
    const cityElement = document.createElement('div');
    cityElement.className = 'recent-city-item';
    const weatherIcon = city.icon ? getWeatherIcon(city.icon) : getWeatherIconFromDescription(city.description, city.icon);

    cityElement.innerHTML = `
      <div class="recent-city-name-container">
        <span class="weather-emoji">${weatherIcon}</span>
        <span class="recent-city-name">${city.name}</span>
      </div>
      <div class="recent-city-temp-container">
        <span class="recent-city-temp">${city.temp}°C</span>
        <button class="recent-city-delete" data-index="${index}">×</button>
      </div>
    `;

    citiesList.appendChild(cityElement);
  });

  document.querySelectorAll('.recent-city-delete').forEach((button) => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(button.dataset.index);
      removeCityFromHistory(index);
    });
  });

  document.querySelectorAll('.recent-city-name').forEach((nameElement) => {
    nameElement.addEventListener('click', (e) => {
      const cityName = e.target.textContent;
      fetchWeather(cityName);
    });
  });
}

function removeCityFromHistory(index) {
  const recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
  recentCities.splice(index, 1);
  localStorage.setItem('recentCities', JSON.stringify(recentCities));
  updateRecentCitiesDisplay();
}

function loadRecentCities() {
  const recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
  if (recentCities.length === 0) {
    const defaultCities = [
      { name: 'Москва', temp: '-4' },
      { name: 'Санкт-Петербург', temp: '-8' },
    ];
    localStorage.setItem('recentCities', JSON.stringify(defaultCities));
  }
  updateRecentCitiesDisplay();
}

function preventTextSelection() {
  document.addEventListener('mousedown', (e) => {
    if (e.detail > 1) e.preventDefault();
  }, false);
}

// Функции для иконок погоды
function getWeatherIcon(iconCode, description = '') {
  const iconMap = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️🌙',
    '03d': '🌤️', '03n': '☁️🌙',
    '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️',
  };

  if (iconCode && iconMap[iconCode]) return iconMap[iconCode];

  const desc = description.toLowerCase();
  if (desc.includes('ясн') || desc.includes('clear')) {
    return iconCode?.endsWith('n') ? '🌙' : '☀️';
  } else if (desc.includes('солн') || desc.includes('sun')) {
    return '☀️';
  } else if (desc.includes('облач')) {
    if (desc.includes('пасмурн') || desc.includes('overcast')) return '☁️';
    if (desc.includes('небольш')) return iconCode?.endsWith('n') ? '☁️🌙' : '⛅';
    return '🌤️';
  } else if (desc.includes('дожд')) {
    if (desc.includes('ливень') || desc.includes('shower')) return '🌧️';
    return '🌦️';
  } else if (desc.includes('снег')) return '❄️';
  else if (desc.includes('гроз')) return '⛈️';
  else if (desc.includes('туман')) return '🌫️';

  return '🌡️';
}

function getWeatherIconFromDescription(description, iconCode = '') {
  if (!description || typeof description !== 'string') {
    return 'fas fa-question-circle'; // Иконка по умолчанию
  }
  const desc = description.toLowerCase();
  if (desc.includes('ясн') || desc.includes('clear')) {
    return iconCode?.endsWith('n') ? '🌙' : '☀️';
  } else if (desc.includes('солн') || desc.includes('sun')) {
    return '☀️';
  } else if (desc.includes('облач') || desc.includes('cloud')) {
    if (desc.includes('пасмурн') || desc.includes('overcast')) return '☁️☁️';
    if (desc.includes('небольш') || desc.includes('few')) return iconCode?.endsWith('n') ? '☁️🌙' : '⛅';
    return '☁️';
  } else if (desc.includes('дожд') || desc.includes('rain')) {
    if (desc.includes('ливень') || desc.includes('shower') || desc.includes('heavy')) return '🌧️';
    return iconCode?.endsWith('n') ? '🌧️' : '🌦️';
  } else if (desc.includes('снег') || desc.includes('snow')) return '❄️';
  else if (desc.includes('гроз') || desc.includes('thunder')) return '⛈️';
  else if (desc.includes('туман') || desc.includes('fog') || desc.includes('mist')) return '🌫️';
  else if (desc.includes('ветер') || desc.includes('wind')) return '💨';

  return getWeatherIcon(iconCode);
}

// Функции для работы с прогнозом
function toggleForecast(period) {
  document.querySelectorAll('.forecast-btn').forEach((btn) => {
    btn.classList.remove('active');
    if (btn.dataset.days === period.toString()) {
      btn.classList.add('active');
    }
  });

  state.currentForecastDays = period;

  if (period === 1 || period === '1') {
    if (elements.weatherForecast) elements.weatherForecast.innerHTML = '';
    showWeatherCard();
    return;
  }

  if (state.currentCity) {
    showLoading();
    fetchWeatherForecast(state.currentCity, period);
  }
}

async function fetchWeatherForecast(city, period) {
  try {
    showLoading();
    const cacheKey = `forecast_${city.toLowerCase()}`;
    const cachedData = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(`${cacheKey}_time`);

    if (cachedData && cacheTime && (Date.now() - parseInt(cacheTime)) < 10 * 60 * 1000) {
      const data = JSON.parse(cachedData);
      processForecastData(data, period);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}&lang=ru`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Ошибка ${response.status}: Не удалось получить прогноз`);

    const data = await response.json();
    localStorage.setItem(cacheKey, JSON.stringify(data));
    localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
    processForecastData(data, period);

  } catch (error) {
    console.error('❌ Ошибка прогноза:', error);
    let errorMessage = 'Не удалось загрузить прогноз';
    if (error.name === 'AbortError') {
      errorMessage = 'Таймаут запроса. Проверьте интернет-соединение';
    } else if (error.message.includes('404')) {
      errorMessage = 'Город не найден';
    }
    showForecastError(errorMessage);
    setTimeout(() => showWeatherCard(), 2000);
  }
}

function processForecastData(data, period) {
  if (period == 2) {
    displayTomorrowForecast(data);
  } else if (period == 3) {
    displayDayAfterTomorrowForecast(data);
  } else if (period == 5 ) {
    display5DayForecast(data);
  } else {
    display5DayForecast(data);
  }

  setTimeout(() => showForecast(), 100);
}

// Отображение прогнозов
function displayTomorrowForecast(data) {
  const forecastContainer = elements.weatherForecast;
  forecastContainer.innerHTML = '';

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toLocaleDateString('ru-RU');

  const tomorrowData = data.list.filter(item => {
    const itemDate = new Date(item.dt * 1000);
    return itemDate.toLocaleDateString('ru-RU') === tomorrowStr;
  });

  if (tomorrowData.length === 0) {
    forecastContainer.innerHTML = '<div class="forecast-error">Нет данных на завтра</div>';
    return;
  }

  const temps = tomorrowData.map(item => item.main.temp);
  const minTemp = Math.round(Math.min(...temps));
  const maxTemp = Math.round(Math.max(...temps));
  const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
  const icons = tomorrowData.map(item => item.weather[0].icon);
  const mostCommonIcon = getMostCommonIcon(icons);

  const title = document.createElement('h3');
  title.className = 'forecast-title';
  title.textContent = `Погода на завтра (${tomorrow.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}) в ${data.city.name}`;
  forecastContainer.appendChild(title);

  const mainInfo = document.createElement('div');
  mainInfo.className = 'tomorrow-main';
  mainInfo.innerHTML = `
    <div class="tomorrow-icon-temp">
      <img src="https://openweathermap.org/img/wn/${mostCommonIcon}@2x.png" alt="Погода" class="big-weather-icon">
      <div class="tomorrow-temp">${avgTemp}°C</div>
    </div>
    <div class="tomorrow-minmax">
      <div class="minmax-item">
        <i class="fas fa-temperature-high"></i>
        <span>Макс: ${maxTemp}°C</span>
      </div>
      <div class="minmax-item">
        <i class="fas fa-temperature-low"></i>
        <span>Мин: ${minTemp}°C</span>
      </div>
    </div>
  `;
  forecastContainer.appendChild(mainInfo);

  const hourlyTitle = document.createElement('h4');
  hourlyTitle.className = 'hourly-title';
  hourlyTitle.textContent = 'Почасовой прогноз:';
  forecastContainer.appendChild(hourlyTitle);

  const hourlyContainer = document.createElement('div');
  hourlyContainer.className = 'hourly-forecast';

  const keyHours = [6, 9, 12, 15, 18, 21];
  keyHours.forEach(hour => {
    const hourData = tomorrowData.find(item => {
      const itemHour = new Date(item.dt * 1000).getHours();
      return itemHour === hour;
    });

    if (hourData) {
      const hourItem = document.createElement('div');
      hourItem.className = 'hour-item';
      hourItem.innerHTML = `
        <div class="hour-time">${hour}:00</div>
        <img src="https://openweathermap.org/img/wn/${hourData.weather[0].icon}.png" alt="${hourData.weather[0].description}">
        <div class="hour-temp">${Math.round(hourData.main.temp)}°C</div>
        <div class="hour-desc">${hourData.weather[0].description}</div>
      `;
      hourlyContainer.appendChild(hourItem);
    }
  });

  forecastContainer.appendChild(hourlyContainer);
  addBackButton(forecastContainer);
}

function displayDayAfterTomorrowForecast(data) {
  const forecastContainer = elements.weatherForecast;
  forecastContainer.innerHTML = '';

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = dayAfter.toLocaleDateString('ru-RU');

  const dayAfterData = data.list.filter((item) => {
    const itemDate = new Date(item.dt * 1000);
    return itemDate.toLocaleDateString('ru-RU') === dayAfterStr;
  });

  if (dayAfterData.length === 0) {
    forecastContainer.innerHTML = '<div class="forecast-error">Нет данных на послезавтра</div>';
    return;
  }

  const temps = dayAfterData.map((item) => item.main.temp);
  const minTemp = Math.round(Math.min(...temps));
  const maxTemp = Math.round(Math.max(...temps));
  const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
  const icons = dayAfterData.map((item) => item.weather[0].icon);
  const mostCommonIcon = getMostCommonIcon(icons);

  const title = document.createElement('h3');
  title.className = 'forecast-title';
  title.textContent = `Погода на послезавтра (${dayAfter.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}) в ${data.city.name}`;
  forecastContainer.appendChild(title);

  const mainInfo = document.createElement('div');
  mainInfo.className = 'tomorrow-main';
  mainInfo.innerHTML = `
    <div class="tomorrow-icon-temp">
      <img src="https://openweathermap.org/img/wn/${mostCommonIcon}@2x.png" alt="Погода" class="big-weather-icon">
      <div class="tomorrow-temp">${avgTemp}°C</div>
    </div>
    <div class="tomorrow-minmax">
      <div class="minmax-item">
        <i class="fas fa-temperature-high"></i>
        <span>Макс: ${maxTemp}°C</span>
      </div>
      <div class="minmax-item">
        <i class="fas fa-temperature-low"></i>
        <span>Мин: ${minTemp}°C</span>
      </div>
    </div>
  `;
  forecastContainer.appendChild(mainInfo);

  const noteElement = document.createElement('div');
  noteElement.className = 'day-after-note';
  noteElement.innerHTML = `
    <i class="fas fa-info-circle"></i>
    <span>Это прогноз на 2 дня вперёд</span>
  `;
  forecastContainer.appendChild(noteElement);

  const hourlyTitle = document.createElement('h4');
  hourlyTitle.className = 'hourly-title';
  hourlyTitle.textContent = 'Почасовой прогноз:';
  forecastContainer.appendChild(hourlyTitle);

  const hourlyContainer = document.createElement('div');
  hourlyContainer.className = 'hourly-forecast';

  const keyHours = [6, 9, 12, 15, 18, 21];
  keyHours.forEach((hour) => {
    const hourData = dayAfterData.find((item) => {
      const itemHour = new Date(item.dt * 1000).getHours();
      return itemHour === hour;
    });

    if (hourData) {
      const hourItem = document.createElement('div');
      hourItem.className = 'hour-item';
      hourItem.innerHTML = `
        <div class="hour-time">${hour}:00</div>
        <img src="https://openweathermap.org/img/wn/${hourData.weather[0].icon}.png" alt="${hourData.weather[0].description}">
        <div class="hour-temp">${Math.round(hourData.main.temp)}°C</div>
        <div class="hour-desc">${hourData.weather[0].description}</div>
      `;
      hourlyContainer.appendChild(hourItem);
    }
  });

  forecastContainer.appendChild(hourlyContainer);
  addBackButton(forecastContainer);
}

function display5DayForecast(data) {
  const forecastContainer = elements.weatherForecast;
  forecastContainer.innerHTML = '';

  const title = document.createElement('h3');
  title.className = 'forecast-title';
  title.textContent = `Прогноз на 5 дней в ${data.city.name}`;
  forecastContainer.appendChild(title);

  const daysContainer = document.createElement('div');
  daysContainer.className = 'five-day-forecast';

  const dailyData = [];
  const seenDays = new Set();

  data.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const dateStr = date.toLocaleDateString('ru-RU');

    if (!seenDays.has(dateStr) && dailyData.length < 5) {
      seenDays.add(dateStr);
      dailyData.push({
        date: dateStr,
        dayName: getDayOfWeek(date),
        icon: item.weather[0].icon,
        temp: Math.round(item.main.temp),
        description: item.weather[0].description
      });
    }
  });

  dailyData.forEach(day => {
    const dayCard = document.createElement('div');
    dayCard.className = 'five-day-card';
    dayCard.innerHTML = `
      <div class="day-name">${day.dayName}</div>
      <div class="day-date">${day.date}</div>
      <img src="https://openweathermap.org/img/wn/${day.icon}.png" alt="${day.description}" class="day-icon">
      <div class="day-temp">${day.temp}°C</div>
      <div class="day-desc">${day.description}</div>
    `;
    daysContainer.appendChild(dayCard);
  });

  forecastContainer.appendChild(daysContainer);
  addBackButton(forecastContainer);
}

// Вспомогательные функции
function getMostCommonIcon(icons) {
  const counts = {};
  icons.forEach(icon => {
    counts[icon] = (counts[icon] || 0) + 1;
  });

  let maxIcon = '01d';
  let maxCount = 0;

  for (const [icon, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxIcon = icon;
    }
  }

  return maxIcon;
}

function getDayOfWeek(date) {
  const days = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];
  return days[date.getDay()];
}

function addBackButton(container) {
  const backBtn = document.createElement('button');
  backBtn.className = 'back-to-current-btn';
  backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Назад к текущей погоде';
  backBtn.addEventListener('click', () => toggleForecast(1));
  container.appendChild(backBtn);
}

function showForecastError(message) {
  const forecastContainer = elements.weatherForecast;
  forecastContainer.innerHTML = `<div class="forecast-error">${message}</div>`;
  showForecast();
}

let popularCities = [];

fetch('./cities.json')
  .then((response) => response.json())
  .then((data) => {
    popularCities = data;
  })
  .catch((error) => console.error('Ошибка загрузки городов:', error));

const suggestCache = {};
const cityInput = document.getElementById('city-input');
const suggestContainer = document.createElement('div');
suggestContainer.id = 'suggestions';
suggestContainer.className = 'suggestions-list';
cityInput.parentNode.insertBefore(suggestContainer, cityInput.nextSibling);

let suggestTimeout;

function showSuggestions(cities) {
  if (cities.length === 0) {
    suggestContainer.innerHTML =
      '<div class="suggestion-item disabled">Города не найдены</div>';
  } else {
    // ✅ ИСПРАВЛЕНО: город это просто строка
    suggestContainer.innerHTML = cities
      .map(
        (city) => `
      <div class="suggestion-item" data-city="${city}">
        <span class="city-name">${city}</span>
      </div>
    `,
      )
      .join('');
  }
  suggestContainer.style.display = 'block';
}

cityInput.addEventListener('input', async (e) => {
  const query = e.target.value.trim();
  clearTimeout(suggestTimeout);

  if (query.length === 0) {
    suggestContainer.innerHTML = '';
    suggestContainer.style.display = 'none';
    return;
  }

  // ✅ ИСПРАВЛЕНО: фильтруем строки напрямую
  const localResults = popularCities
    .filter((city) => city.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 10);

  if (localResults.length > 0) {
    showSuggestions(localResults);
  }

  if (query.length >= 2) {
    suggestTimeout = setTimeout(async () => {
      try {
        if (suggestCache[query]) {
          const allResults = [...localResults, ...suggestCache[query]];
          showSuggestions(allResults);
          return;
        }

        const response = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=8de6d91e5c6c5e321c7ff4267271d953`,
        );
        const apiCities = await response.json();

        // ✅ ИСПРАВЛЕНО: извлекаем только названия
        const cityNames = apiCities.map((c) => c.name);
        suggestCache[query] = cityNames;

        const allResults = [...localResults, ...cityNames];
        showSuggestions(allResults);
      } catch (error) {
        console.error('Ошибка при поиске городов:', error);
        showSuggestions(localResults);
      }
    }, 700);
  }
});

suggestContainer.addEventListener('click', (e) => {
  const item = e.target.closest('.suggestion-item');
  if (item && !item.classList.contains('disabled')) {
    const cityName = item.dataset.city;
    cityInput.value = cityName;
    suggestContainer.innerHTML = '';
    suggestContainer.style.display = 'none';
    document.getElementById('search-btn').click();
  }
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('#city-input') && !e.target.closest('#suggestions')) {
    suggestContainer.style.display = 'none';
  }
});
