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
};

// Состояние приложения
const state = {
  currentCity: 'Москва',
  recentCities: [],
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

  setInterval(() => {
    if (
      elements.refreshBtn &&
      !elements.refreshBtn.classList.contains('loading')
    ) {
      elements.refreshBtn.classList.add('pulse');
      setTimeout(() => {
        if (elements.refreshBtn) elements.refreshBtn.classList.remove('pulse');
      }, 2000);
    }
  }, 30000);
});

// Основная функция получения погоды
async function fetchWeather(city) {
  const forbiddenNames = [
    'россия',
    'russia',
    'ru',
    'rf',
    'сша',
    'usa',
    'united states',
    'us',
    'китай',
    'china',
    'cn',
    'германия',
    'germany',
    'de',
    'франция',
    'france',
    'fr',
    'испания',
    'spain',
    'es',
    'италия',
    'italy',
    'it',
  ];

  // 2. Проверяем введенное название
  const normalizedCity = city.toLowerCase().trim();

  if (forbiddenNames.includes(normalizedCity)) {
    alert(
      '⚠️ Пожалуйста, введите название ГОРОДА (например: Москва, Нью-Йорк), а не страны.',
    );
    hideLoading(); // Скрываем индикатор загрузки, если он есть
    if (elements.refreshBtn) elements.refreshBtn.classList.remove('loading');
    return; // Прерываем выполнение функции
  }

  // 3. Дополнительная проверка: если введено очень короткое или общее название
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
    console.log('API вернул город:', data.name);

    // Добавляем в историю с полными данными
    addToRecentCities(data);

    updateWeatherDisplay(data);
    showWeatherCard();

    if (elements.refreshBtn) {
      setTimeout(() => elements.refreshBtn.classList.remove('loading'), 500);
    }
  } catch (error) {
    showError();
    console.error('Ошибка:', error);
    if (elements.refreshBtn) elements.refreshBtn.classList.remove('loading');
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

  // 1. Обновляем название города и страны
  elements.cityName.textContent = `${cityName}, ${country}`;

  // 2. Температура
  elements.tempValue.textContent = temp;

  // 3. ПОЛУЧАЕМ ЭМОДЗИ ИКОНКУ (такую же как в истории)
  const weatherEmoji = getWeatherIcon(iconCode, description);

  // 4. СОЗДАЕМ КОНТЕЙНЕР ДЛЯ ИКОНКИ И ОПИСАНИЯ
  // Ищем или создаем контейнер для иконки и описания
  let weatherEmojiContainer = document.querySelector(
    '.weather-emoji-container',
  );
  let weatherDescriptionContainer = document.querySelector(
    '.weather-description-container',
  );

  if (!weatherEmojiContainer) {
    // Создаем контейнер для иконки
    weatherEmojiContainer = document.createElement('div');
    weatherEmojiContainer.className = 'weather-emoji-container';

    // Создаем контейнер для описания
    weatherDescriptionContainer = document.createElement('div');
    weatherDescriptionContainer.className = 'weather-description-container';

    // Находим родительский элемент (обычно после температуры)
    const tempElement = document.querySelector('.temperature');
    if (tempElement && tempElement.parentNode) {
      const parent = tempElement.parentNode;

      // Создаем общий контейнер
      const weatherInfoContainer = document.createElement('div');
      weatherInfoContainer.className = 'weather-info-container';

      // Добавляем в него иконку и описание
      weatherInfoContainer.appendChild(weatherEmojiContainer);
      weatherInfoContainer.appendChild(weatherDescriptionContainer);

      // Вставляем после температуры
      tempElement.parentNode.insertBefore(
        weatherInfoContainer,
        tempElement.nextSibling,
      );
    }
  }

  // 5. ОБНОВЛЯЕМ ИКОНКУ И ОПИСАНИЕ
  weatherEmojiContainer.innerHTML = `<span class="weather-main-emoji">${weatherEmoji}</span>`;

  // Описание с большой буквы
  const capitalizedDescription =
    description.charAt(0).toUpperCase() + description.slice(1);
  weatherDescriptionContainer.innerHTML = `<div class="weather-main-description">${capitalizedDescription}</div>`;

  // 6. Скрываем старую иконку если она есть
  if (elements.weatherIcon) {
    elements.weatherIcon.style.display = 'none';
  }

  // 7. Остальные данные
  elements.feelsLike.textContent = feelsLike + '°C';
  elements.humidity.textContent = humidity + '%';
  elements.windSpeed.textContent = windSpeed + ' м/с';
  elements.pressure.textContent = pressure + ' гПа';

  updateCurrentDate();
}
// Вспомогательные функции
function showLoading() {
  if (elements.loading) elements.loading.style.display = 'block';
  if (elements.weatherCard) {
    elements.weatherCard.style.display = 'none';
    elements.weatherCard.classList.remove('show');
  }
  if (elements.errorMessage) elements.errorMessage.style.display = 'none';
}

function showWeatherCard() {
  if (elements.loading) elements.loading.style.display = 'none';
  if (elements.errorMessage) elements.errorMessage.style.display = 'none';
  if (elements.weatherCard) {
    elements.weatherCard.style.display = 'block';
    setTimeout(() => elements.weatherCard.classList.add('show'), 10);
  }
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

// Функция добавления города в историю (с иконками)
// Замените функцию addToRecentCities на эту:

function addToRecentCities(weatherData) {
  // Проверяем, что данные корректны
  if (!weatherData || !weatherData.name) {
    console.error('Неверные данные для истории:', weatherData);
    return;
  }

  const cityEntry = {
    name: weatherData.name,
    icon: weatherData.weather?.[0]?.icon || '01d', // Сохраняем код иконки
    temp: Math.round(weatherData.main?.temp || 0),
    description: weatherData.weather?.[0]?.description || '',
  };

  console.log('Добавляем в историю:', cityEntry);

  // Удаляем если уже есть (безопасная проверка)
  state.recentCities = state.recentCities.filter(
    (item) =>
      item.name &&
      cityEntry.name &&
      item.name.toLowerCase() !== cityEntry.name.toLowerCase(),
  );

  // Добавляем в начало
  state.recentCities.unshift(cityEntry);

  // Ограничиваем 5 городами
  if (state.recentCities.length > 5) {
    state.recentCities = state.recentCities.slice(0, 5);
  }

  // Сохраняем
  localStorage.setItem('recentCities', JSON.stringify(state.recentCities));

  // Обновляем отображение
  updateRecentCitiesDisplay();
}// Загрузка истории

// Отображение истории с иконками
function updateRecentCitiesDisplay() {
  const citiesList = document.querySelector('.recent-cities-list');
  if (!citiesList) return;

  const recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];

  if (recentCities.length === 0) {
    citiesList.innerHTML =
      '<div class="empty-history">История поиска пуста</div>';
    return;
  }

  citiesList.innerHTML = '';

  recentCities.forEach((city, index) => {
    const cityElement = document.createElement('div');
    cityElement.className = 'recent-city-item';

    // Получаем правильную иконку погоды
    // Используем icon код из OpenWeatherMap если есть, иначе description
    let weatherIcon;
    if (city.icon) {
      weatherIcon = getWeatherIcon(city.icon);
    } else if (city.description) {
      weatherIcon = getWeatherIconFromDescription(city.description, city.icon);
    } else {
      weatherIcon = getWeatherIconFromDescription('', city.icon);
    }

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

  // Добавляем обработчики событий для кнопок удаления
  document.querySelectorAll('.recent-city-delete').forEach((button) => {
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(button.dataset.index);
      removeCityFromHistory(index);
    });
  });

  // Добавляем обработчики событий для названий городов
  document.querySelectorAll('.recent-city-name').forEach((nameElement) => {
    nameElement.addEventListener('click', (e) => {
      const cityName = e.target.textContent;
      fetchWeather(cityName);
    });
  });
}// Функция для получения иконки города
function getWeatherIcon(iconCode, description = '') {
  const iconMap = {
    '01d': '☀️', // ясно день
    '01n': '🌙', // ясно ночь
    '02d': '⛅', // немного облаков день
    '02n': '☁️🌙', // немного облаков ночь
    '03d': '🌤️', // рассеянные облака день
    '03n': '☁️🌙', // рассеянные облака ночь
    '04d': '☁️', // облачно
    '04n': '☁️', // облачно ночь
    '09d': '🌧️', // ливень
    '09n': '🌧️', // ливень ночь
    '10d': '🌦️', // дождь день
    '10n': '🌧️', // дождь ночь
    '11d': '⛈️', // гроза день
    '11n': '⛈️', // гроза ночь
    '13d': '❄️', // снег день
    '13n': '❄️', // снег ночь
    '50d': '🌫️', // туман день
    '50n': '🌫️', // туман ночь
  };

  // Сначала пробуем по iconCode
  if (iconCode && iconMap[iconCode]) {
    return iconMap[iconCode];
  }

  // Если нет, используем описание
  const desc = description.toLowerCase();
  if (desc.includes('ясн') || desc.includes('clear')) {
    return iconCode?.endsWith('n') ? '🌙' : '☀️';
  } else if (desc.includes('солн') || desc.includes('sun')) {
    return '☀️';
  } else if (desc.includes('облач')) {
    if (desc.includes('пасмурн') || desc.includes('overcast')) {
      return '☁️';
    }
    if (desc.includes('небольш')) {
      return iconCode?.endsWith('n') ? '☁️🌙' : '⛅';
    }
    return '🌤️';
  } else if (desc.includes('дожд')) {
    if (desc.includes('ливень') || desc.includes('shower')) {
      return '🌧️';
    }
    return '🌦️';
  } else if (desc.includes('снег')) {
    return '❄️';
  } else if (desc.includes('гроз')) {
    return '⛈️';
  } else if (desc.includes('туман')) {
    return '🌫️';
  }

  return '🌡️';
}
// Альтернатива: более точные иконки на основе описания
function getWeatherIconFromDescription(description, iconCode = '') {
  const desc = description.toLowerCase();

  if (desc.includes('ясн') || desc.includes('clear')) {
    return iconCode?.endsWith('n') ? '🌙' : '☀️';
  } else if (desc.includes('солн') || desc.includes('sun')) {
    return '☀️';
  } else if (desc.includes('облач') || desc.includes('cloud')) {
    if (desc.includes('пасмурн') || desc.includes('overcast')) {
      return '☁️☁️';
    }
    if (desc.includes('небольш') || desc.includes('few')) {
      return iconCode?.endsWith('n') ? '☁️🌙' : '⛅';
    }
    return '☁️';
  } else if (desc.includes('дожд') || desc.includes('rain')) {
    if (
      desc.includes('ливень') ||
      desc.includes('shower') ||
      desc.includes('heavy')
    ) {
      return '🌧️';
    }
    return iconCode?.endsWith('n') ? '🌧️' : '🌦️';
  } else if (desc.includes('снег') || desc.includes('snow')) {
    return '❄️';
  } else if (desc.includes('гроз') || desc.includes('thunder')) {
    return '⛈️';
  } else if (
    desc.includes('туман') ||
    desc.includes('fog') ||
    desc.includes('mist')
  ) {
    return '🌫️';
  } else if (desc.includes('ветер') || desc.includes('wind')) {
    return '💨';
  }

  // Если не распознали, используем код иконки
  return getWeatherIcon(iconCode);
}function removeCityFromHistory(index) {
  const recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
  recentCities.splice(index, 1);
  localStorage.setItem('recentCities', JSON.stringify(recentCities));
  updateRecentCitiesDisplay();
}

// Функция для загрузки истории городов
function loadRecentCities() {
  const recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];

  // Если нет городов в истории, добавляем примеры
  if (recentCities.length === 0) {
    const defaultCities = [
      { name: 'Москва', temp: '-4' },
      { name: 'Санкт-Петербург', temp: '-8' },
    ];
    localStorage.setItem('recentCities', JSON.stringify(defaultCities));
  }

  updateRecentCitiesDisplay();
}

// Загружаем историю при загрузке страницы
function preventTextSelection() {
  document.addEventListener(
    'mousedown',
    (e) => {
      if (e.detail > 1) e.preventDefault();
    },
    false,
  );
}
