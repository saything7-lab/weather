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

  // СРАЗУ скрываем карточку
  if (elements.weatherCard) {
    elements.weatherCard.style.display = 'none';
    elements.weatherCard.classList.remove('show');
  } try {
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
    if (elements.refreshBtn) {
      setTimeout(() => {
        elements.refreshBtn.classList.remove('loading');
      }, 500);
    }
  } catch (error) {
    // Показываем ошибку
    showError();
    console.error('Ошибка при получении погоды:', error);
    if (elements.refreshBtn) {
      elements.refreshBtn.classList.remove('loading');
    }
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

function addToRecentCities(city) {
  // Приводим к единому регистру для сравнения
  const normalizedCity = city.trim();

  // Удаляем город, если он уже есть в истории
  state.recentCities = state.recentCities.filter(
    (c) => c.trim().toLowerCase() !== normalizedCity.toLowerCase(),
  );

  // Добавляем город в начало массива
  state.recentCities.unshift(normalizedCity);

  // Ограничиваем 3 городами
  if (state.recentCities.length > 3) {
    state.recentCities = state.recentCities.slice(0, 3);
  }

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

  if (state.recentCities.length === 0) {
    elements.recentCities.innerHTML =
      '<div class="empty-history">История поиска пуста</div>';
    return;
  }

  state.recentCities.forEach((city) => {
    // Контейнер - просто фон
    const wrapper = document.createElement('div');
    wrapper.className = 'city-history-wrapper';

    // Внутренний блок
    const inner = document.createElement('div');
    inner.className = 'city-history-inner';

    // Блок с иконкой и названием
    const content = document.createElement('div');
    content.className = 'city-history-content';

    // Иконка (выберите любую из вариантов ниже)
    const icon = document.createElement('span');
    icon.className = 'city-history-emoji';
    // Варианты иконок (раскомментируйте нужную):
    // icon.textContent = '📍'; // Метка на карте
    // icon.textContent = '🌤️'; // Легкая облачность
    // icon.textContent = '🏙️'; // Городской пейзаж
    icon.textContent = '🗺️'; // Карта
    // icon.textContent = '🌆'; // Закат города
    // icon.innerHTML = '<i class="fas fa-city"></i>'; // Font Awesome

    // Название города (ЕДИНСТВЕННЫЙ кликабельный элемент)
    const cityEl = document.createElement('span');
    cityEl.className = 'city-history-name';
    cityEl.textContent = city;

    // Кнопка удаления
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'city-history-delete';
    deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
    deleteBtn.title = 'Удалить из истории';
    deleteBtn.type = 'button';

    // Собираем структуру
    content.appendChild(icon);
    content.appendChild(cityEl);
    inner.appendChild(content);
    inner.appendChild(deleteBtn);
    wrapper.appendChild(inner);

    // ОБРАБОТЧИКИ СОБЫТИЙ:

    // 1. ТОЛЬКО на названии города
    cityEl.addEventListener('click', (e) => {
      e.stopPropagation();

      // Заполняем поле ввода
      elements.cityInput.value = city;

      // Получаем погоду
      fetchWeather(city);

      // Подсветка активного города
      document.querySelectorAll('.city-history-name').forEach((el) => {
        el.classList.remove('city-history-name--active');
      });
      cityEl.classList.add('city-history-name--active');
    });

    // Эффекты при наведении на название
    cityEl.addEventListener('mouseenter', () => {
      cityEl.classList.add('city-history-name--hover');
    });

    cityEl.addEventListener('mouseleave', () => {
      cityEl.classList.remove('city-history-name--hover');
    });

    // 2. ТОЛЬКО на кнопке удаления
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();

      // Подтверждение удаления
      const confirmed = window.confirm(`Удалить "${city}" из истории?`);
      if (confirmed) {
        // Удаляем из массива
        state.recentCities = state.recentCities.filter((c) => c !== city);

        // Сохраняем в localStorage
        localStorage.setItem(
          'recentCities',
          JSON.stringify(state.recentCities),
        );

        // Обновляем отображение
        updateRecentCitiesDisplay();

        // Показываем уведомление
        console.log(`Город "${city}" удалён из истории`);
      }
    });

    // Эффекты при наведении на кнопку удаления
    deleteBtn.addEventListener('mouseenter', () => {
      deleteBtn.classList.add('city-history-delete--hover');
    });

    deleteBtn.addEventListener('mouseleave', () => {
      deleteBtn.classList.remove('city-history-delete--hover');
    });

    // 3. Явно запрещаем клики на контейнере
    wrapper.addEventListener('click', (e) => {
      // Если кликнули именно на wrapper (не на дочерние элементы)
      if (e.target === wrapper || e.target === inner || e.target === content) {
        e.preventDefault();
        e.stopPropagation();
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

