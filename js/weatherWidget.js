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

  let weatherEmojiContainer = document.querySelector(
    '.weather-emoji-container',
  );
  let weatherDescriptionContainer = document.querySelector(
    '.weather-description-container',
  );

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
      tempElement.parentNode.insertBefore(
        weatherInfoContainer,
        tempElement.nextSibling,
      );
    }
  }

  weatherEmojiContainer.innerHTML = `<span class="weather-main-emoji">${weatherEmoji}</span>`;
  const capitalizedDescription =
    description.charAt(0).toUpperCase() + description.slice(1);
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
  if (elements.weatherForecast)
    elements.weatherForecast.classList.remove('show');
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
            block: 'center',
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
            block: 'center',
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
