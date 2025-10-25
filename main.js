const API_KEY = '4d8fb5b93d4af21d66a2948710284366';

const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const voiceSearchBtn = document.getElementById('voice-search-btn');
const speakSummaryBtn = document.getElementById('speak-summary-btn');
const unitToggle = document.getElementById('unit-toggle');

let unit = 'metric';
let rainCondition = 'No rain';

unitToggle.addEventListener('change', () => {
  unit = unitToggle.value;
  const city = cityInput.value.trim();
  if (city) getWeather(city);
});

function getTempUnitSymbol() {
  return unit === 'metric' ? '°C' : '°F';
}

function getSpeedUnit() {
  return unit === 'metric' ? 'km/h' : 'mph';
}

async function getWeather(city) {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${unit}`);
    if (!response.ok) throw new Error(`City not found: ${city}`);
    const data = await response.json();

    const { name, main, weather, wind, sys, rain } = data;

    document.getElementById('city-name').textContent = name;
    document.getElementById('temp').textContent = `${main.temp} ${getTempUnitSymbol()}`;
    document.getElementById('max-temp').textContent = `${main.temp_max} ${getTempUnitSymbol()}`;
    document.getElementById('min-temp').textContent = `${main.temp_min} ${getTempUnitSymbol()}`;
    document.getElementById('humidity').textContent = `${main.humidity}%`;
    document.getElementById('sunrise').textContent = new Date(sys.sunrise * 1000).toLocaleTimeString();
    document.getElementById('sunset').textContent = new Date(sys.sunset * 1000).toLocaleTimeString();
    document.getElementById('feels-like').textContent = `${main.feels_like} ${getTempUnitSymbol()}`;
    document.getElementById('wind-speed').textContent = `${wind.speed} ${getSpeedUnit()}`;
    document.getElementById('wind-degree').textContent = `${wind.deg}°`;

    rainCondition = rain && rain["1h"] ? `Rain in the last hour: ${rain["1h"]} mm` : 'No rain today.';

    getForecast(city);
  } catch (error) {
    alert(`Error fetching weather data: ${error.message}`);
  }
}

async function getForecast(city) {
  const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=${unit}`);
  const data = await response.json();

  const forecastTable = document.getElementById('forecast-table');
  forecastTable.innerHTML = '';

  const dailyData = {};
  data.list.forEach(entry => {
    const date = entry.dt_txt.split(' ')[0];
    if (!dailyData[date]) {
      dailyData[date] = {
        temp: entry.main.temp,
        maxTemp: entry.main.temp_max,
        minTemp: entry.main.temp_min,
        weather: entry.weather[0].description,
        trend: 'Stable'
      };
    } else {
      dailyData[date].maxTemp = Math.max(dailyData[date].maxTemp, entry.main.temp_max);
      dailyData[date].minTemp = Math.min(dailyData[date].minTemp, entry.main.temp_min);
    }
  });

  Object.keys(dailyData).forEach((date, index, arr) => {
    const dayData = dailyData[date];
    if (index > 0) {
      const prevDayData = dailyData[arr[index - 1]];
      dayData.trend = dayData.temp > prevDayData.temp ? 'Upward' : dayData.temp < prevDayData.temp ? 'Downward' : 'Stable';
    }

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${new Date(date).toLocaleDateString('en-US', { weekday: 'long' })}</td>
      <td>${dayData.temp.toFixed(2)} ${getTempUnitSymbol()}</td>
      <td>${dayData.maxTemp.toFixed(2)} ${getTempUnitSymbol()}</td>
      <td>${dayData.minTemp.toFixed(2)} ${getTempUnitSymbol()}</td>
      <td>${dayData.weather}</td>
      <td>${dayData.trend}</td>
    `;
    forecastTable.appendChild(row);
  });
}

function generateEnglishSummary() {
  const cityName = document.getElementById('city-name').textContent;
  const temp = document.getElementById('temp').textContent;
  const maxTemp = document.getElementById('max-temp').textContent;
  const minTemp = document.getElementById('min-temp').textContent;
  const humidity = document.getElementById('humidity').textContent;
  const windSpeed = document.getElementById('wind-speed').textContent;
  const feelsLike = document.getElementById('feels-like').textContent;
  const sunrise = document.getElementById('sunrise').textContent;
  const sunset = document.getElementById('sunset').textContent;

  return `${cityName} weather today:
    Temperature: ${temp}, Max Temp: ${maxTemp}, Min Temp: ${minTemp},
    Humidity: ${humidity}, Wind Speed: ${windSpeed},
    Feels Like: ${feelsLike},
    Sunrise: ${sunrise}, Sunset: ${sunset},
    Rain Condition: ${rainCondition}`;
}

function speakEnglishSummary() {
  const summary = generateEnglishSummary();
  const utterance = new SpeechSynthesisUtterance(summary);
  utterance.lang = 'en-US';
  speechSynthesis.speak(utterance);
}

speakSummaryBtn.addEventListener('click', () => {
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  } else {
    speakEnglishSummary();
  }
});

searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) getWeather(city);
});

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.onstart = () => console.log('Voice recognition started...');
recognition.onspeechend = () => recognition.stop();
recognition.onresult = event => {
  const transcript = event.results[0][0].transcript;
  cityInput.value = transcript;
  getWeather(transcript);
};

voiceSearchBtn.addEventListener('click', () => recognition.start());