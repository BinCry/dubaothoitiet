// Constants for API and DOM elements
// IMPORTANT: Replace 'YOUR_API_KEY' with your actual OpenWeatherMap API key
const API_KEY = '31bb9df826339f11169d386a48fd3698'; 
const BASE_URL = 'https://api.openweathermap.org/data/2.5/forecast';

// Get DOM elements
const cityInput = document.getElementById('cityInput'); // Desktop search input
const searchBtn = document.getElementById('searchBtn'); // Desktop search button
const locationBtn = document.getElementById('locationBtn'); // Desktop location button
const darkModeToggle = document.getElementById('darkModeToggle'); // Desktop dark mode toggle
const darkModeIcon = document.getElementById('darkModeIcon'); // Desktop dark mode icon

// Mobile menu elements
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileMenu = document.getElementById('mobileMenu');
const closeMenuBtn = document.getElementById('closeMenuBtn');
const cityInputMobile = document.getElementById('cityInputMobile');
const searchBtnMobile = document.getElementById('searchBtnMobile');
const locationBtnMobile = document.getElementById('locationBtnMobile');
const darkModeToggleMobile = document.getElementById('darkModeToggleMobile');
const darkModeIconMobile = document.getElementById('darkModeIconMobile');


const weatherInfo = document.getElementById('weatherInfo');
const currentCity = document.getElementById('currentCity');
const currentDescription = document.getElementById('currentDescription');
const currentTemp = document.getElementById('currentTemp');
const currentHumidity = document.getElementById('currentHumidity');
const currentWind = document.getElementById('currentWind');
const weatherIconSpan = document.getElementById('weatherIcon'); // Span for dynamic weather icon

const hourlyForecastSection = document.getElementById('hourlyForecast');
const dailyForecastSection = document.getElementById('dailyForecast');
const detailCardsContainer = document.getElementById('detailCards');

const uvIndexElement = document.getElementById('uvIndex');
const uvDescriptionElement = document.getElementById('uvDescription');
const detailHumidityElement = document.getElementById('detailHumidity');
const feelsLikeElement = document.getElementById('feelsLike');
const detailWindSpeedElement = document.getElementById('detailWindSpeed');
const detailWindDirectionElement = document.getElementById('detailWindDirection');
const sunriseValueElement = document.getElementById('sunriseValue');
const sunsetValueElement = document.getElementById('sunsetValue');
const pressureElement = document.getElementById('pressure');
const aqiValueElement = document.getElementById('aqiValue');
const aqiDescriptionElement = document.getElementById('aqiDescription');


const tempChartCanvas = document.getElementById('tempChart');
const humidityChartCanvas = document.getElementById('humidityChart'); 
const adviceList = document.getElementById('adviceList');
const adviceBox = document.getElementById('adviceBox');

let tempChart; // To store the Chart.js instance for temperature
let humidityChart; // To store the Chart.js instance for humidity

// --- Event Listeners ---
// Desktop
searchBtn.addEventListener('click', () => getWeather(cityInput.value));
cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        getWeather(cityInput.value);
    }
});
locationBtn.addEventListener('click', getLocationWeather);
darkModeToggle.addEventListener('click', toggleDarkMode);

// Mobile
hamburgerBtn.addEventListener('click', () => {
    mobileMenu.classList.add('active');
    document.body.classList.add('no-scroll');
});

closeMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.remove('active');
    document.body.classList.remove('no-scroll');
});

searchBtnMobile.addEventListener('click', () => {
    getWeather(cityInputMobile.value);
    mobileMenu.classList.remove('active'); // Close menu after search
    document.body.classList.remove('no-scroll');
});

cityInputMobile.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        getWeather(cityInputMobile.value);
        mobileMenu.classList.remove('active'); // Close menu after search
        document.body.classList.remove('no-scroll');
    }
});

locationBtnMobile.addEventListener('click', () => {
    getLocationWeather();
    mobileMenu.classList.remove('active'); // Close menu after getting location
    document.body.classList.remove('no-scroll');
});

darkModeToggleMobile.addEventListener('click', toggleDarkMode);


// --- Functions ---

/**
 * Fetches weather data based on city name or coordinates.
 * @param {string} query - City name (e.g., "Hanoi")
 * @param {number} [lat] - Latitude (optional)
 * @param {number} [lon] - Longitude (optional)
 */
async function fetchWeather(query, lat, lon) {
    let url = '';
    if (lat && lon) {
        url = `${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=vi`;
    } else if (query) {
        url = `${BASE_URL}?q=${query}&appid=${API_KEY}&units=metric&lang=vi`;
    } else {
        console.error('Không có thông tin thành phố hoặc tọa độ.');
        displayMessage('Vui lòng nhập tên thành phố hoặc cho phép truy cập vị trí.');
        return;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Không tìm thấy thành phố. Vui lòng kiểm tra lại tên.');
            }
            throw new Error(`Lỗi HTTP: ${response.status}`);
        }
        const data = await response.json();
        renderWeather(data);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu thời tiết:', error);
        displayMessage(`Lỗi: ${error.message}`);
    }
}

/**
 * Gets city name from input and calls fetchWeather.
 * @param {string} city - The city name from the input field.
 */
function getWeather(city) {
    if (city.trim()) {
        fetchWeather(city.trim());
    } else {
        displayMessage('Vui lòng nhập tên thành phố.');
    }
}

/**
 * Gets user's current location and calls fetchWeather.
 */
function getLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeather(null, lat, lon); // Pass null for query, use lat/lon
            },
            (error) => {
                console.error('Lỗi khi lấy vị trí:', error);
                let errorMessage = 'Không thể lấy vị trí của bạn.';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Bạn đã từ chối yêu cầu vị trí.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Thông tin vị trí không khả dụng.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Hết thời gian chờ khi lấy vị trí.';
                        break;
                    case error.UNKNOWN_ERROR:
                        errorMessage = 'Lỗi không xác định khi lấy vị trí.';
                        break;
                }
                displayMessage(errorMessage);
            }
        );
    } else {
        displayMessage('Trình duyệt của bạn không hỗ trợ Geolocation.');
    }
}

/**
 * Renders current weather information and calls other rendering functions.
 * @param {object} data - Weather data from OpenWeatherMap API.
 */
function renderWeather(data) {
    // Current weather data (list[0])
    const current = data.list[0];
    const city = data.city;

    currentCity.textContent = `${city.name}, ${city.country}`;
    currentDescription.querySelector('span:last-child').textContent = current.weather[0].description.charAt(0).toUpperCase() + current.weather[0].description.slice(1);
    
    // Set dynamic weather icon (emoji)
    weatherIconSpan.textContent = getWeatherEmoji(current.weather[0].icon);

    currentTemp.textContent = `${Math.round(current.main.temp)}°C`;
    currentHumidity.textContent = `${current.main.humidity}%`;
    currentWind.textContent = `${current.wind.speed} m/s`;

    // Animate weather card
    weatherInfo.classList.remove('opacity-0', 'scale-95');
    weatherInfo.classList.add('opacity-100', 'scale-100');

    renderHourlyForecast(data.list);
    renderDailyForecast(data.list);
    renderDetailedCards(current, city);
    renderChart(data.list); // Temperature chart
    renderHumidityChart(data.list); // Humidity chart
    renderAdvice(current.main.temp, current.weather[0].main);
    setBackground(current.weather[0].main);
}

/**
 * Returns an appropriate emoji based on OpenWeatherMap icon code.
 * @param {string} iconCode - OpenWeatherMap icon code (e.g., "01d", "10n").
 * @returns {string} Emoji representing the weather.
 */
function getWeatherEmoji(iconCode) {
    switch (iconCode.slice(0, 2)) { // Take first two characters (e.g., "01" from "01d")
        case '01': return '☀️'; // Clear sky
        case '02': return '🌤️'; // Few clouds
        case '03': return '☁️'; // Scattered clouds
        case '04': return '☁️'; // Broken clouds / Overcast
        case '09': return '🌧️'; // Shower rain
        case '10': return '🌦️'; // Rain
        case '11': return '⛈️'; // Thunderstorm
        case '13': return '❄️'; // Snow
        case '50': return '🌫️'; // Mist
        default: return '🌈'; // Default/unknown
    }
}

/**
 * Renders the hourly forecast (next 24 hours).
 * @param {Array} list - List of forecast data from API.
 */
function renderHourlyForecast(list) {
    const hourlyContainer = hourlyForecastSection.querySelector('.hourly-scroll-container');
    hourlyContainer.innerHTML = ''; // Clear previous hourly forecast

    // Display next 8 hourly forecasts (24 hours, as API is 3-hourly)
    // Ensure we always try to render 8 items to fill the container, even if some are placeholders
    const numItemsToRender = 8; 
    for (let i = 0; i < numItemsToRender; i++) {
        const item = list[i]; // Get item if it exists, otherwise it will be undefined
        
        let time = 'N/A';
        let temp = 'N/A';
        let emoji = '❓'; // Default emoji for unknown/missing data
        let windSpeed = 'N/A';

        if (item) { // If item data is available
            const date = new Date(item.dt * 1000);
            time = `${date.getHours().toString().padStart(2, '0')}:00`;
            temp = Math.round(item.main.temp);
            emoji = getWeatherEmoji(item.weather[0].icon);
            windSpeed = Math.round(item.wind.speed * 3.6); // Convert m/s to km/h
        }

        const hourlyDiv = document.createElement('div');
        hourlyDiv.classList.add('hourly-item', 'inline-flex', 'flex-col', 'items-center', 'justify-center', 'p-3', 'rounded-xl', 'shadow-sm', 'bg-white', 'bg-opacity-20', 'transition-transform', 'duration-200', 'hover:scale-105', 'border', 'border-white', 'border-opacity-30');
        hourlyDiv.innerHTML = `
            <p class="text-sm font-medium">${time}</p>
            <p class="text-3xl my-1">${emoji}</p>
            <p class="text-xl font-bold">${temp}°C</p>
            <p class="text-xs text-center">${windSpeed} km/h</p>
        `;
        hourlyContainer.appendChild(hourlyDiv);
    }
    hourlyForecastSection.classList.remove('opacity-0', 'scale-95');
    hourlyForecastSection.classList.add('opacity-100', 'scale-100');
}

/**
 * Renders the daily forecast (next 5 days, min/max temp).
 * @param {Array} list - List of forecast data from API.
 */
function renderDailyForecast(list) {
    dailyForecastSection.innerHTML = '<h3 class="w-full text-3xl font-bold mb-6 text-center text-shadow-xs">Dự báo 5 ngày</h3>'; // Clear previous daily forecast

    const dailyData = {}; // Object to store daily min/max temps

    list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' }); // e.g., "T2, 29/7"
        const temp = item.main.temp;

        if (!dailyData[dayKey]) {
            dailyData[dayKey] = {
                minTemp: temp,
                maxTemp: temp,
                icon: item.weather[0].icon,
                description: item.weather[0].description,
                hourlyTemps: [] // Store all hourly temps for the day
            };
        } else {
            dailyData[dayKey].minTemp = Math.min(dailyData[dayKey].minTemp, temp);
            dailyData[dayKey].maxTemp = Math.max(dailyData[dayKey].maxTemp, temp);
        }
        dailyData[dayKey].hourlyTemps.push(temp);
    });

    // Get today's date to exclude current day from "next 5 days"
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let count = 0;
    for (const dayKey in dailyData) {
        const date = new Date(dayKey.split(', ')[1].split('/').reverse().join('-')); // Reconstruct date for comparison
        date.setHours(0, 0, 0, 0);

        // Skip if it's the current day or we already have 5 days
        if (date.getTime() === today.getTime() || count >= 5) {
            continue;
        }

        const data = dailyData[dayKey];
        const minTemp = Math.round(data.minTemp);
        const maxTemp = Math.round(data.maxTemp);
        const emoji = getWeatherEmoji(data.icon);

        // Calculate current temp for marker (average of the day's hourly temps)
        const currentDayAvgTemp = data.hourlyTemps.reduce((sum, t) => sum + t, 0) / data.hourlyTemps.length;

        // Calculate marker position for the temperature range bar
        const range = maxTemp - minTemp;
        let markerPosition = 0;
        if (range > 0) {
            markerPosition = ((currentDayAvgTemp - minTemp) / range) * 100;
        }
        markerPosition = Math.max(0, Math.min(100, markerPosition)); // Clamp between 0 and 100

        const dailyDiv = document.createElement('div');
        dailyDiv.classList.add('daily-forecast-item', 'w-full', 'flex', 'items-center', 'justify-between', 'p-4', 'rounded-xl', 'shadow-sm', 'bg-white', 'bg-opacity-20', 'transition-transform', 'duration-300', 'hover:scale-103', 'border', 'border-white', 'border-opacity-30');
        dailyDiv.innerHTML = `
            <span class="text-xl font-medium w-1/5">${dayKey}</span>
            <span class="text-3xl w-1/10 text-center">${emoji}</span>
            <span class="text-xl font-bold w-1/5 text-center">${minTemp}°C</span>
            <div class="temp-range-bar w-2/5 mx-2 relative">
                <div class="temp-current-marker" style="left: ${markerPosition}%;"></div>
            </div>
            <span class="text-xl font-bold w-1/5 text-center">${maxTemp}°C</span>
        `;
        dailyForecastSection.appendChild(dailyDiv);
        count++;
    }
    dailyForecastSection.classList.remove('opacity-0', 'scale-95');
    dailyForecastSection.classList.add('opacity-100', 'scale-100');
}


/**
 * Renders detailed weather information into specific cards.
 * @param {object} current - Current weather data.
 * @param {object} city - City data.
 */
function renderDetailedCards(current, city) {
    // UV Index (Mock Data as OpenWeatherMap Free API doesn't provide it)
    const uvValue = Math.floor(Math.random() * 11); // Mock UV from 0-10
    let uvDesc = '';
    if (uvValue <= 2) uvDesc = 'Thấp';
    else if (uvValue <= 5) uvDesc = 'Trung bình';
    else if (uvValue <= 7) uvDesc = 'Cao';
    else if (uvValue <= 10) uvDesc = 'Rất cao';
    else uvDesc = 'Cực đoan';
    uvIndexElement.textContent = uvValue;
    uvDescriptionElement.textContent = uvDesc;

    // Humidity (already in current weather, just update the detail card)
    detailHumidityElement.textContent = `${current.main.humidity}%`;

    // Feels Like
    feelsLikeElement.textContent = `${Math.round(current.main.feels_like)}°C`;

    // Wind Speed and Direction
    detailWindSpeedElement.textContent = `${Math.round(current.wind.speed * 3.6)} km/h`; // Convert m/s to km/h
    detailWindDirectionElement.textContent = getWindDirection(current.wind.deg);

    // Sunrise/Sunset
    const sunriseDate = new Date(city.sunrise * 1000);
    const sunsetDate = new Date(city.sunset * 1000);
    sunriseValueElement.textContent = `${sunriseDate.getHours().toString().padStart(2, '0')}:${sunriseDate.getMinutes().toString().padStart(2, '0')}`;
    sunsetValueElement.textContent = `${sunsetDate.getHours().toString().padStart(2, '0')}:${sunsetDate.getMinutes().toString().padStart(2, '0')}`;

    // Pressure
    pressureElement.textContent = `${current.main.pressure} hPa`;

    // AQI (Mock Data as OpenWeatherMap Free API doesn't provide it)
    const aqiValue = Math.floor(Math.random() * (150 - 20 + 1)) + 20; // Mock AQI from 20-150
    let aqiDesc = '';
    if (aqiValue <= 50) aqiDesc = 'Tốt';
    else if (aqiValue <= 100) aqiDesc = 'Trung bình';
    else if (aqiValue <= 150) aqiDesc = 'Kém';
    else aqiDesc = 'Rất kém';
    aqiValueElement.textContent = aqiValue;
    aqiDescriptionElement.textContent = aqiDesc;

    detailCardsContainer.classList.remove('opacity-0', 'scale-95');
    detailCardsContainer.classList.add('opacity-100', 'scale-100');
}

/**
 * Converts wind degrees to cardinal direction.
 * @param {number} deg - Wind direction in degrees.
 * @returns {string} Cardinal direction (e.g., "Đông", "Tây Nam").
 */
function getWindDirection(deg) {
    const directions = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
}


/**
 * Renders the temperature chart using Chart.js.
 * @param {Array} list - List of forecast data from API.
 */
function renderChart(list) {
    const labels = [];
    const temperatures = [];

    // Get data for the next 24 hours (8 items, as API is 3-hourly)
    for (let i = 0; i < Math.min(list.length, 8); i++) {
        const item = list[i];
        const date = new Date(item.dt * 1000);
        labels.push(`${date.getHours().toString().padStart(2, '0')}:00`);
        temperatures.push(item.main.temp); // Use raw temp for chart accuracy
    }

    if (tempChart) {
        tempChart.destroy(); // Destroy existing chart instance if any
    }

    const ctx = tempChartCanvas.getContext('2d');
    if (!ctx) {
        console.error('Không thể lấy context 2D cho biểu đồ nhiệt độ.');
        return; // Exit if context is not available
    }

    tempChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Nhiệt độ (°C)',
                data: temperatures,
                borderColor: 'rgba(255, 165, 0, 0.9)', // Orange, more vibrant
                backgroundColor: 'rgba(255, 165, 0, 0.3)', // Light orange fill
                borderWidth: 3, // Slightly thinner line for elegance
                tension: 0.4,
                fill: true,
                pointBackgroundColor: 'rgba(255, 165, 0, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'white',
                        font: {
                            size: 15,
                            weight: '600'
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: 'white',
                        font: {
                            size: 13
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.2)'
                    }
                },
                y: {
                    ticks: {
                        color: 'white',
                        font: {
                            size: 13
                        },
                        callback: function(value) {
                            return value + '°C';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.2)'
                    }
                }
            }
        }
    });

    // Animate chart section
    tempChartCanvas.closest('section').classList.remove('opacity-0', 'scale-95');
    tempChartCanvas.closest('section').classList.add('opacity-100', 'scale-100');
}

/**
 * Renders the humidity chart using Chart.js.
 * @param {Array} list - List of forecast data from API.
 */
function renderHumidityChart(list) {
    const labels = [];
    const humidities = [];

    // Get data for the next 24 hours (8 items, as API is 3-hourly)
    for (let i = 0; i < Math.min(list.length, 8); i++) {
        const item = list[i];
        const date = new Date(item.dt * 1000);
        labels.push(`${date.getHours().toString().padStart(2, '0')}:00`);
        humidities.push(item.main.humidity);
    }

    if (humidityChart) {
        humidityChart.destroy(); // Destroy existing chart instance if any
    }

    const ctx = humidityChartCanvas.getContext('2d');
    if (!ctx) {
        console.error('Không thể lấy context 2D cho biểu đồ độ ẩm.');
        return; // Exit if context is not available
    }

    humidityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Độ ẩm (%)',
                data: humidities,
                borderColor: 'rgba(0, 191, 255, 0.9)', // Deep Sky Blue, more vibrant
                backgroundColor: 'rgba(0, 191, 255, 0.3)', // Light Deep Sky Blue fill
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: 'rgba(0, 191, 255, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'white',
                        font: {
                            size: 15,
                            weight: '600'
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: 'white',
                        font: {
                            size: 13
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.2)'
                    }
                },
                y: {
                    ticks: {
                        color: 'white',
                        font: {
                            size: 13
                        },
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.2)'
                    },
                    min: 0,
                    max: 100
                }
            }
        }
    });

    // Animate chart section
    humidityChartCanvas.closest('section').classList.remove('opacity-0', 'scale-95');
    humidityChartCanvas.closest('section').classList.add('opacity-100', 'scale-100');
}


/**
 * Generates and renders clothing suggestions based on temperature and weather condition.
 * @param {number} temp - Current temperature in Celsius.
 * @param {string} condition - Main weather condition (e.g., "Rain", "Snow", "Clear").
 */
function renderAdvice(temp, condition) {
    adviceList.innerHTML = ''; // Clear previous advice
    const advice = [];

    const lowerCaseCondition = condition.toLowerCase();

    // General advice for Vietnamese weather
    if (temp > 30) {
        advice.push('Nên mặc quần áo mỏng, thoáng mát (áo thun, quần short).');
        advice.push('Uống nhiều nước để tránh mất nước.');
        advice.push('Mang theo mũ, nón, kính râm khi ra ngoài.');
        advice.push('Sử dụng kem chống nắng.');
    } else if (temp >= 25 && temp <= 30) {
        advice.push('Thích hợp cho trang phục thường ngày (áo sơ mi, quần jean).');
        advice.push('Mang theo áo khoác mỏng nếu có gió hoặc vào buổi tối.');
    } else if (temp >= 20 && temp < 25) {
        advice.push('Nên mặc áo dài tay hoặc áo khoác mỏng.');
        advice.push('Giữ ấm cơ thể vào buổi sáng sớm và tối muộn.');
    } else if (temp < 20) {
        advice.push('Mặc áo ấm, áo len hoặc áo khoác dày.');
        advice.push('Mang khăn quàng cổ, găng tay nếu trời lạnh buốt.');
        advice.push('Giữ ấm chân tay.');
    }

    // Specific advice based on weather conditions
    if (lowerCaseCondition.includes('rain') || lowerCaseCondition.includes('drizzle')) {
        advice.push('Mang theo ô (dù), áo mưa.');
        advice.push('Đi giày dép không thấm nước.');
        advice.push('Cẩn thận đường trơn trượt.');
    }
    if (lowerCaseCondition.includes('thunderstorm')) {
        advice.push('Tránh ra ngoài khi có sấm sét.');
        advice.push('Rút phích cắm các thiết bị điện.');
    }
    if (lowerCaseCondition.includes('snow')) { // Although rare in Vietnam, good to include
        advice.push('Mặc nhiều lớp áo ấm, giữ ấm toàn thân.');
        advice.push('Mang giày bốt chống trượt.');
    }
    if (lowerCaseCondition.includes('clear')) {
        if (temp > 28) {
            advice.push('Kính râm, kem chống nắng, mũ rộng vành.');
        }
    }
    if (['mist', 'smoke', 'haze', 'dust', 'fog'].some(c => lowerCaseCondition.includes(c))) {
        advice.push('Đeo khẩu trang khi ra ngoài để bảo vệ hô hấp.');
        advice.push('Cẩn thận khi lái xe do tầm nhìn hạn chế.');
    }


    // Default advice if no specific rules apply
    if (advice.length === 0) {
        advice.push('Kiểm tra thời tiết để có lựa chọn phù hợp nhất!');
    }

    // Remove duplicates and limit to a reasonable number of suggestions
    const uniqueAdvice = [...new Set(advice)];
    uniqueAdvice.slice(0, 5).forEach(item => { // Limit to top 5 most relevant advice
        const li = document.createElement('li');
        li.textContent = item;
        adviceList.appendChild(li);
    });

    // Animate advice box
    adviceBox.classList.remove('opacity-0', 'scale-95');
    adviceBox.classList.add('opacity-100', 'scale-100');
}

/**
 * Sets the background image/gradient based on weather condition.
 * @param {string} condition - Main weather condition (e.g., "Rain", "Snow", "Clear").
 */
function setBackground(condition) {
    const body = document.body;
    body.classList.remove('clear', 'clouds', 'rain', 'snow', 'drizzle', 'thunderstorm', 'mist', 'smoke', 'haze', 'dust', 'fog', 'sand', 'ash', 'squall', 'tornado');

    const lowerCaseCondition = condition.toLowerCase();

    if (lowerCaseCondition.includes('clear')) {
        body.classList.add('clear');
    } else if (lowerCaseCondition.includes('clouds')) {
        body.classList.add('clouds');
    } else if (lowerCaseCondition.includes('rain')) {
        body.classList.add('rain');
    } else if (lowerCaseCondition.includes('snow')) {
        body.classList.add('snow');
    } else if (lowerCaseCondition.includes('drizzle')) {
        body.classList.add('drizzle');
    } else if (lowerCaseCondition.includes('thunderstorm')) {
        body.classList.add('thunderstorm');
    } else if (['mist', 'smoke', 'haze', 'dust', 'fog', 'sand', 'ash', 'squall', 'tornado'].some(c => lowerCaseCondition.includes(c))) {
        body.classList.add('mist'); // Group all atmospheric conditions
    } else {
        // Default fallback background if condition is not matched
        body.style.backgroundImage = 'linear-gradient(to top, #4facfe 0%, #00f2fe 100%)';
    }
}

/**
 * Toggles dark mode on/off.
 */
function toggleDarkMode() {
    document.body.classList.toggle('dark');
    // Save user preference to localStorage
    if (document.body.classList.contains('dark')) {
        localStorage.setItem('darkMode', 'enabled');
        // Change icon to sun for both desktop and mobile toggles
        darkModeIcon.innerHTML = `<path fill-rule="evenodd" d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.06l1.59-1.591zM12 18a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V18a.75.75 0 01.75-.75zM5.166 7.5a.75.75 0 00-1.06-1.06l-1.59 1.59a.75.75 0 101.06 1.06l1.59-1.59zM18.894 17.834a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.06 1.06l1.59 1.591zM3.25 12a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75.75zM14.25 5.166a.75.75 0 001.06-1.06l-1.591-1.59a.75.75 0 10-1.06 1.06l1.59 1.591zM21.75 12a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75.75zM5.166 14.25a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 101.06-1.06l-1.59-1.591z" clip-rule="evenodd" />`;
        darkModeIconMobile.innerHTML = `<path fill-rule="evenodd" d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.06l1.59-1.591zM12 18a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V18a.75.75 0 01.75-.75zM5.166 7.5a.75.75 0 00-1.06-1.06l-1.59 1.59a.75.75 0 101.06 1.06l1.59-1.59zM18.894 17.834a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.06 1.06l1.59 1.591zM3.25 12a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75.75zM14.25 5.166a.75.75 0 001.06-1.06l-1.591-1.59a.75.75 0 10-1.06 1.06l1.59 1.591zM21.75 12a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75.75zM5.166 14.25a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 101.06-1.06l-1.59-1.591z" clip-rule="evenodd" />`;
    } else {
        localStorage.setItem('darkMode', 'disabled');
        // Change icon to moon for both desktop and mobile toggles
        darkModeIcon.innerHTML = `<path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.173.64l-.397 2.013a4.412 4.412 0 002.572 2.572l2.014-.396a.75.75 0 01.64.172 7.501 7.501 0 01-9.485 9.485A.75.75 0 011.718 14.472a7.501 7.501 0 017.81-12.754z" clip-rule="evenodd" />`;
        darkModeIconMobile.innerHTML = `<path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.173.64l-.397 2.013a4.412 4.412 0 002.572 2.572l2.014-.396a.75.75 0 01.64.172 7.501 7.501 0 01-9.485 9.485A.75.75 0 011.718 14.472a7.501 7.501 0 017.81-12.754z" clip-rule="evenodd" />`;
    }
}

/**
 * Displays a temporary message to the user.
 * @param {string} message - The message to display.
 */
function displayMessage(message) {
    const messageBox = document.createElement('div');
    messageBox.textContent = message;
    messageBox.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.5s ease-in-out;
        font-size: 1.2rem;
        text-align: center;
    `;
    document.body.appendChild(messageBox);

    // Fade in
    setTimeout(() => {
        messageBox.style.opacity = '1';
    }, 10);

    // Fade out and remove
    setTimeout(() => {
        messageBox.style.opacity = '0';
        messageBox.addEventListener('transitionend', () => messageBox.remove());
    }, 3000);
}


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Check for dark mode preference on load
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark');
        darkModeIcon.innerHTML = `<path fill-rule="evenodd" d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.06l1.59-1.591zM12 18a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V18a.75.75 0 01.75-.75zM5.166 7.5a.75.75 0 00-1.06-1.06l-1.59 1.59a.75.75 0 101.06 1.06l1.59-1.59zM18.894 17.834a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.06 1.06l1.59 1.591zM3.25 12a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75.75zM14.25 5.166a.75.75 0 001.06-1.06l-1.591-1.59a.75.75 0 10-1.06 1.06l1.59 1.591zM21.75 12a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75.75zM5.166 14.25a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 101.06-1.06l-1.59-1.591z" clip-rule="evenodd" />`;
        darkModeIconMobile.innerHTML = `<path fill-rule="evenodd" d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.06l1.59-1.591zM12 18a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V18a.75.75 0 01.75-.75zM5.166 7.5a.75.75 0 00-1.06-1.06l-1.59 1.59a.75.75 0 101.06 1.06l1.59-1.59zM18.894 17.834a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.06 1.06l1.59 1.591zM3.25 12a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75.75zM14.25 5.166a.75.75 0 001.06-1.06l-1.591-1.59a.75.75 0 10-1.06 1.06l1.59 1.591zM21.75 12a.75.75 0 01-.75-.75v-2.25a.75.75 0 011.5 0v2.25a.75.75 0 01-.75.75zM5.166 14.25a.75.75 0 00-1.06 1.06l1.59 1.591a.75.75 0 101.06-1.06l-1.59-1.591z" clip-rule="evenodd" />`;
    } else {
        darkModeIcon.innerHTML = `<path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.173.64l-.397 2.013a4.412 4.412 0 002.572 2.572l2.014-.396a.75.75 0 01.64.172 7.501 7.501 0 01-9.485 9.485A.75.75 0 011.718 14.472a7.501 7.501 0 017.81-12.754z" clip-rule="evenodd" />`;
        darkModeIconMobile.innerHTML = `<path fill-rule="evenodd" d="M9.528 1.718a.75.75 0 01.173.64l-.397 2.013a4.412 4.412 0 002.572 2.572l2.014-.396a.75.75 0 01.64.172 7.501 7.501 0 01-9.485 9.485A.75.75 0 011.718 14.472a7.501 7.501 0 017.81-12.754z" clip-rule="evenodd" />`;
    }

    // Fetch weather for a default city (e.g., Ho Chi Minh) on page load
    fetchWeather('Ho Chi Minh');
});
