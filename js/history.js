function addToRecentCities(weatherData) {
  if (!weatherData || !weatherData.name) return;

  const cityEntry = {
    name: weatherData.name,
    icon: weatherData.weather?.[0]?.icon || '01d',
    temp: Math.round(weatherData.main?.temp || 0),
    description: weatherData.weather?.[0]?.description || '',
  };

  state.recentCities = state.recentCities.filter(
    (item) =>
      item.name &&
      cityEntry.name &&
      item.name.toLowerCase() !== cityEntry.name.toLowerCase(),
  );

  state.recentCities.unshift(cityEntry);
  if (state.recentCities.length > 5)
    state.recentCities = state.recentCities.slice(0, 5);
  localStorage.setItem('recentCities', JSON.stringify(state.recentCities));
  updateRecentCitiesDisplay();
}

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
    const weatherIcon = city.icon
      ? getWeatherIcon(city.icon)
      : getWeatherIconFromDescription(city.description, city.icon);

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
  document.addEventListener(
    'mousedown',
    (e) => {
      if (e.detail > 1) e.preventDefault();
    },
    false,
  );
}

function getWeatherIcon(iconCode, description = '') {
  const iconMap = {
    '01d': '☀️',
    '01n': '🌙',
    '02d': '⛅',
    '02n': '☁️🌙',
    '03d': '🌤️',
    '03n': '☁️🌙',
    '04d': '☁️',
    '04n': '☁️',
    '09d': '🌧️',
    '09n': '🌧️',
    '10d': '🌦️',
    '10n': '🌧️',
    '11d': '⛈️',
    '11n': '⛈️',
    '13d': '❄️',
    '13n': '❄️',
    '50d': '🌫️',
    '50n': '🌫️',
  };

  if (iconCode && iconMap[iconCode]) return iconMap[iconCode];

  const desc = description.toLowerCase();
  if (desc.includes('ясн') || desc.includes('clear')) {
    return iconCode?.endsWith('n') ? '🌙' : '☀️';
  } else if (desc.includes('солн') || desc.includes('sun')) {
    return '☀️';
  } else if (desc.includes('облач')) {
    if (desc.includes('пасмурн') || desc.includes('overcast')) return '☁️';
    if (desc.includes('небольш'))
      return iconCode?.endsWith('n') ? '☁️🌙' : '⛅';
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
    if (desc.includes('небольш') || desc.includes('few'))
      return iconCode?.endsWith('n') ? '☁️🌙' : '⛅';
    return '☁️';
  } else if (desc.includes('дожд') || desc.includes('rain')) {
    if (
      desc.includes('ливень') ||
      desc.includes('shower') ||
      desc.includes('heavy')
    )
      return '🌧️';
    return iconCode?.endsWith('n') ? '🌧️' : '🌦️';
  } else if (desc.includes('снег') || desc.includes('snow')) return '❄️';
  else if (desc.includes('гроз') || desc.includes('thunder')) return '⛈️';
  else if (
    desc.includes('туман') ||
    desc.includes('fog') ||
    desc.includes('mist')
  )
    return '🌫️';
  else if (desc.includes('ветер') || desc.includes('wind')) return '💨';

  return getWeatherIcon(iconCode);
}
