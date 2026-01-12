// Ко
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
  clearInputBtn: null, // Добавим позже
  refreshBtn: document.getElementById('refresh-btn'),
};

// Состояние приложения
const state = {
  currentCity: 'Москва',
  recentCities: [],
};

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  // Загружаем последний город из localStorage
  preventTextSelection();
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
  elements.clearInputBtn = document.getElementById('clear-input');

  // Обработчик для кнопки очистки
  if (elements.clearInputBtn) {
    elements.clearInputBtn.addEventListener('click', () => {
      elements.cityInput.value = '';
      elements.cityInput.focus();

      // Анимация кнопки очистки
      elements.clearInputBtn.style.transform = 'scale(0.8)';
      setTimeout(() => {
        elements.clearInputBtn.style.transform = 'scale(1)';
      }, 200);
    });
  }

  // Обработчик для кнопки обновления
  if (elements.refreshBtn) {
    elements.refreshBtn.addEventListener('click', () => {
      if (state.currentCity) {
        // Добавляем класс loading
        elements.refreshBtn.classList.add('loading');

        // Обновляем погоду
        fetchWeather(state.currentCity);

        // Анимация успеха
        setTimeout(() => {
          elements.refreshBtn.classList.remove('loading');
          elements.refreshBtn.classList.add('success');

          // Эффект пульсации
          elements.refreshBtn.classList.add('pulse');

          setTimeout(() => {
            elements.refreshBtn.classList.remove('success', 'pulse');
          }, 2000);

        }, 1000);
      }
    });
  }

  // Автоматическая пульсация кнопки обновления раз в 30 секунд
  setInterval(() => {
    if (elements.refreshBtn && !elements.refreshBtn.classList.contains('loading')) {
      elements.refreshBtn.classList.add('pulse');
      setTimeout(() => {
        if (elements.refreshBtn) {
          elements.refreshBtn.classList.remove('pulse');
        }
      }, 2000);
    }
  }, 30000);
});
let fetchCount = 0;
// Основная функция получения погоды
async function fetchWeather(city) {
  try {
    showLoading();

    const url = `${BASE_URL}?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}&lang=ru`;
    const response = await fetch(url);

    if (!response.ok) throw new Error('Город не найден');

    const data = await response.json();

    // Обновляем состояние
    state.currentCity = data.name;
    localStorage.setItem('lastCity', data.name);

    // Добавляем в историю с полными данными
    addToRecentCities(data);

    updateWeatherDisplay(data);
    showWeatherCard();
  } catch (error) {
    showError();
    console.error('Ошибка:', error);
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

  // Показываем загрузку
  if (elements.loading) {
    elements.loading.style.display = 'block';
  }

  // Скрываем карточку
  if (elements.weatherCard) {
    elements.weatherCard.style.display = 'none';
    elements.weatherCard.classList.remove('show');
  }

  // Скрываем ошибку
  if (elements.errorMessage) {
    elements.errorMessage.style.display = 'none';
  }
}
function showWeatherCard() {

  // Скрываем загрузку
  if (elements.loading) {
    elements.loading.style.display = 'none';
  }

  // Скрываем ошибку
  if (elements.errorMessage) {
    elements.errorMessage.style.display = 'none';
  }

  // Показываем карточку с анимацией
  if (elements.weatherCard) {
    elements.weatherCard.style.display = 'block';

    // Небольшая задержка для анимации
    setTimeout(() => {
      elements.weatherCard.classList.add('show');
    }, 10);
  }
}
function showError() {

  // Скрываем загрузку
  if (elements.loading) {
    elements.loading.style.display = 'none';
  }

  // Скрываем карточку
  if (elements.weatherCard) {
    elements.weatherCard.style.display = 'none';
    elements.weatherCard.classList.remove('show');
  }

  // Показываем ошибку
  if (elements.errorMessage) {
    elements.errorMessage.style.display = 'block';
  }
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

function addToRecentCities(cityData) {
  // cityData теперь объект с полными данными
  const cityEntry = {
    city: cityData.name.trim(),
    country: cityData.sys.country,
    icon: cityData.weather[0].icon,
    temp: Math.round(cityData.main.temp),
    description: cityData.weather[0].description,
    timestamp: Date.now() // для сортировки
  };

  // Удаляем если город уже есть в истории
  state.recentCities = state.recentCities.filter(
    (entry) => entry.city.toLowerCase() !== cityEntry.city.toLowerCase()
  );

  // Добавляем в начало
  state.recentCities.unshift(cityEntry);

  // Ограничиваем 3 городами
  if (state.recentCities.length > 3) {
    state.recentCities = state.recentCities.slice(0, 3);
  }

  // Сохраняем в localStorage
  localStorage.setItem('recentCities', JSON.stringify(state.recentCities));

  // Обновляем отображение
  updateRecentCitiesDisplay();
}

// В инициализации, если история пуста
function loadRecentCities() {
  const saved = localStorage.getItem('recentCities');
  if (saved) {
    try {
      state.recentCities = JSON.parse(saved);
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
      state.recentCities = [];
    }
  } else {
    // Пример начальных данных (можно убрать)
    state.recentCities = [
      {
        city: "Москва",
        country: "RU",
        icon: "04d",
        temp: 5,
        description: "облачно",
        timestamp: Date.now()
      },
      {
        city: "Лондон",
        country: "GB",
        icon: "10d",
        temp: 12,
        description: "небольшой дождь",
        timestamp: Date.now() - 100000
      }
    ];
  }
  updateRecentCitiesDisplay();
}
function updateRecentCitiesDisplay() {
  elements.recentCities.innerHTML = '';

  if (state.recentCities.length === 0) {
    elements.recentCities.innerHTML =
      '<div class="empty-history">История поиска пуста</div>';
    return;
  }

  state.recentCities.forEach((entry) => {
    // Контейнер
    const wrapper = document.createElement('div');
    wrapper.className = 'city-history-wrapper';

    // Внутренний блок
    const inner = document.createElement('div');
    inner.className = 'city-history-inner';

    // Блок с иконкой погоды и названием
    const content = document.createElement('div');
    content.className = 'city-history-content';

    // Иконка погоды (маленькая)
    const weatherIcon = document.createElement('img');
    weatherIcon.className = 'history-weather-icon';
    weatherIcon.src = `https://openweathermap.org/img/wn/${entry.icon}.png`;
    weatherIcon.alt = entry.description;
    weatherIcon.title = entry.description;
    weatherIcon.width = 30;
    weatherIcon.height = 30;

    // Название города и температура
    const cityInfo = document.createElement('div');
    cityInfo.className = 'history-city-info';

    const cityName = document.createElement('span');
    cityName.className = 'history-city-name';
    cityName.textContent = entry.city;

    const cityTemp = document.createElement('span');
    cityTemp.className = 'history-city-temp';
    cityTemp.textContent = `${entry.temp}°C`;

    cityInfo.appendChild(cityName);
    cityInfo.appendChild(cityTemp);

    // Кнопка удаления
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'city-history-delete';
    deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
    deleteBtn.title = 'Удалить из истории';
    deleteBtn.type = 'button';

    // Собираем структуру
    content.appendChild(weatherIcon);
    content.appendChild(cityInfo);
    inner.appendChild(content);
    inner.appendChild(deleteBtn);
    wrapper.appendChild(inner);

    // ОБРАБОТЧИКИ СОБЫТИЙ:

    // Клик по всей области города
    content.addEventListener('click', (e) => {
      e.stopPropagation();
      elements.cityInput.value = entry.city;
      fetchWeather(entry.city);

      // Подсветка активного города
      document.querySelectorAll('.city-history-content').forEach((el) => {
        el.classList.remove('active');
      });
      content.classList.add('active');
    });

    // Кнопка удаления
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Удалить "${entry.city}" из истории?`)) {
        state.recentCities = state.recentCities.filter(
          (item) => item.city !== entry.city,
        );
        localStorage.setItem(
          'recentCities',
          JSON.stringify(state.recentCities),
        );
        updateRecentCitiesDisplay();
      }
    });

    elements.recentCities.appendChild(wrapper);
  });
}
function preventTextSelection() {
  // Предотвращаем выделение текста при клике
  document.addEventListener(
    'mousedown',
    function (e) {
      if (e.detail > 1) {
        e.preventDefault();
      }
    },
    false,
  );

  // Предотвращаем выделение текста в элементах истории
  const style = document.createElement('style');
  style.textContent = `
        .city-container {
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        }
        
        .city-name.clickable {
            user-select: text;
            -webkit-user-select: text;
            -moz-user-select: text;
            -ms-user-select: text;
        }
    `;
  document.head.appendChild(style);
}


