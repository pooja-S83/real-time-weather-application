const API_KEY = '4d8fb5b93d4af21d66a2948710284366';

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const voiceSearchBtn = document.getElementById('voice-search-btn');
const speakSummaryBtn = document.getElementById('speak-summary-btn');

// Variable to store rain condition
let rainCondition = 'No rain'; // Default: No rain

// Function to fetch current weather data
async function getWeather(city) {
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
        if (!response.ok) throw new Error(`City not found: ${city}`);
        const data = await response.json();

        const { name, main, weather, wind, sys, rain } = data;

        // Update elements with weather data
        document.getElementById('city-name').textContent = name;
        document.getElementById('temp').textContent = `${main.temp} °C`;
        document.getElementById('max-temp').textContent = `${main.temp_max} °C`;
        document.getElementById('min-temp').textContent = `${main.temp_min} °C`;
        document.getElementById('humidity').textContent = `${main.humidity}%`;
        document.getElementById('sunrise').textContent = new Date(sys.sunrise * 1000).toLocaleTimeString();
        document.getElementById('sunset').textContent = new Date(sys.sunset * 1000).toLocaleTimeString();
        document.getElementById('feels-like').textContent = `${main.feels_like} °C`;
        document.getElementById('wind-speed').textContent = `${wind.speed} km/h`;
        document.getElementById('wind-degree').textContent = `${wind.deg}°`;

        // Check rain condition
        if (rain && rain["1h"]) {
            rainCondition = `Rain in the last hour: ${rain["1h"]} mm`;
        } else {
            rainCondition = 'No rain today.';
        }

        // Fetch forecast data
        getForecast(city);
    } catch (error) {
        alert(`Error fetching weather data: ${error.message}`);
    }
}

// Function to fetch forecast data
async function getForecast(city) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`);
    const data = await response.json();

    const forecastTable = document.getElementById('forecast-table');
    forecastTable.innerHTML = ''; // Clear previous data

    // Process forecast data to display daily data
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

    // Populate the forecast table
    Object.keys(dailyData).forEach((date, index, arr) => {
        const dayData = dailyData[date];

        // Calculate trend based on temperature change
        if (index > 0) {
            const prevDayData = dailyData[arr[index - 1]];
            dayData.trend = dayData.temp > prevDayData.temp ? 'Upward' : dayData.temp < prevDayData.temp ? 'Downward' : 'Stable';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(date).toLocaleDateString('en-US', { weekday: 'long' })}</td>
            <td>${dayData.temp.toFixed(2)} °C</td>
            <td>${dayData.maxTemp.toFixed(2)} °C</td>
            <td>${dayData.minTemp.toFixed(2)} °C</td>
            <td>${dayData.weather}</td>
            <td>${dayData.trend}</td>
        `;
        forecastTable.appendChild(row);
    });
}

// Generate today's weather summary in English
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

    // English summary including rain condition, feels like, sunrise, and sunset
    return `${cityName} weather today:
        Temperature: ${temp}, Max Temp: ${maxTemp}, Min Temp: ${minTemp},
        Humidity: ${humidity}, Wind Speed: ${windSpeed},
        Feels Like: ${feelsLike},
        Sunrise: ${sunrise}, Sunset: ${sunset},
        Rain Condition: ${rainCondition}`;
}

// Function to speak the summary in English
function speakEnglishSummary() {
    const summary = generateEnglishSummary();

    // Set up speech synthesis
    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.lang = 'en-US'; // English language code

    // Speak the summary
    speechSynthesis.speak(utterance);
}

// Event listener for speak summary button
speakSummaryBtn.addEventListener('click', () => {
    const summary = generateEnglishSummary();

    // Set up speech synthesis
    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.lang = 'en-US'; // English language code

    // Speak the summary
    speechSynthesis.speak(utterance);

    // Add functionality to stop speaking when the button is clicked again
    speakSummaryBtn.addEventListener('click', () => {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel(); // Stop speaking if it's already speaking
        }
    });
});

// Search button event listener
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeather(city);
    }
});

// Voice search functionality
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

recognition.onstart = function () {
    console.log('Voice recognition started. Speak now...');
};

recognition.onspeechend = function () {
    recognition.stop();
};

recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    cityInput.value = transcript;
    getWeather(transcript);
};

// Voice search button event listener
voiceSearchBtn.addEventListener('click', () => {
    recognition.start();
});
