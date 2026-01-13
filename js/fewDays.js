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

    if (
      cachedData &&
      cacheTime &&
      Date.now() - parseInt(cacheTime) < 10 * 60 * 1000
    ) {
      const data = JSON.parse(cachedData);
      processForecastData(data, period);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}&lang=ru`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeoutId);

    if (!response.ok)
      throw new Error(`Ошибка ${response.status}: Не удалось получить прогноз`);

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
  } else if (period == 5) {
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

  const tomorrowData = data.list.filter((item) => {
    const itemDate = new Date(item.dt * 1000);
    return itemDate.toLocaleDateString('ru-RU') === tomorrowStr;
  });

  if (tomorrowData.length === 0) {
    forecastContainer.innerHTML =
      '<div class="forecast-error">Нет данных на завтра</div>';
    return;
  }

  const temps = tomorrowData.map((item) => item.main.temp);
  const minTemp = Math.round(Math.min(...temps));
  const maxTemp = Math.round(Math.max(...temps));
  const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
  const icons = tomorrowData.map((item) => item.weather[0].icon);
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
  keyHours.forEach((hour) => {
    const hourData = tomorrowData.find((item) => {
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
    forecastContainer.innerHTML =
      '<div class="forecast-error">Нет данных на послезавтра</div>';
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

  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dateStr = date.toLocaleDateString('ru-RU');

    if (!seenDays.has(dateStr) && dailyData.length < 5) {
      seenDays.add(dateStr);
      dailyData.push({
        date: dateStr,
        dayName: getDayOfWeek(date),
        icon: item.weather[0].icon,
        temp: Math.round(item.main.temp),
        description: item.weather[0].description,
      });
    }
  });

  dailyData.forEach((day) => {
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

function getMostCommonIcon(icons) {
  const counts = {};
  icons.forEach((icon) => {
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
  backBtn.innerHTML =
    '<i class="fas fa-arrow-left"></i> Назад к текущей погоде';
  backBtn.addEventListener('click', () => toggleForecast(1));
  container.appendChild(backBtn);
}

function showForecastError(message) {
  const forecastContainer = elements.weatherForecast;
  forecastContainer.innerHTML = `<div class="forecast-error">${message}</div>`;
  showForecast();
}
