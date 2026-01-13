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

  const localResults = popularCities
    .filter((city) => city.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 10);

  if (localResults.length > 0) {
    showSuggestions(localResults);
  }

  /*
    if (query.length >= 2) {
      suggestTimeout = setTimeout(async () => {
        try {
          if (suggestCache[query]) {
            const allResults = [...localResults, ...suggestCache[query]];
            showSuggestions(allResults);
            return;
          }
  
          const response = await fetch(
              `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=YOUR_KEY`,
          );
  
          const data = await response.json();
  
  // 1) если статус не 2xx — не пытаемся map, выводим локальные подсказки
          if (!response.ok) {
            console.error('OpenWeather error:', response.status, data);
            showSuggestions(localResults);
            return;
          }
  
  // 2) если пришло не то, что ожидаем — тоже не map
          if (!Array.isArray(data)) {
            console.error('Unexpected API shape:', data);
            showSuggestions(localResults);
            return;
          }
  
          const cityNames = data.map(c => c.name).filter(Boolean);
          suggestCache[query] = cityNames;
  
          const allResults = [...localResults, ...cityNames];
          showSuggestions(allResults);
  
        } catch (error) {
          console.error('Ошибка при поиске городов:', error);
          showSuggestions(localResults);
        }
      }, 700);
    }
  */
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
