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
