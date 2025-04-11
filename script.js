document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const locationInput = document.getElementById('location-input');
    const searchBtn = document.getElementById('search-btn');
    const suggestionsContainer = document.getElementById('suggestions');
    const currentWeatherSection = document.getElementById('current-weather');
    const weatherDetailsSection = document.getElementById('weather-details');
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // API Configuration
    const apiKey = 'b65b0d0d97682a5d10115a2d76766096';
    let debounceTimer;
    
    // Event Listeners
    searchBtn.addEventListener('click', fetchWeatherData);
    locationInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') fetchWeatherData();
    });
    
    // Enable debounced search suggestions
    locationInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        const query = locationInput.value.trim();
        
        if (query.length > 2) {
            debounceTimer = setTimeout(() => {
                fetchLocationSuggestions(query);
            }, 300);
        } else {
            suggestionsContainer.style.display = 'none';
        }
    });
    
    // Close suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            suggestionsContainer.style.display = 'none';
        }
    });
    
    // Fetch weather data function
    async function fetchWeatherData() {
        const location = locationInput.value.trim();
        if (!location) {
            showError('Please enter a location');
            return;
        }
        
        // Get selected options
        const selectedOptions = Array.from(
            document.querySelectorAll('input[name="weather-option"]:checked')
        ).map(option => option.value);
        
        if (selectedOptions.length === 0) {
            showError('Please select at least one weather option');
            return;
        }
        
        showLoading(true);
        
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`
            );
            
            if (!response.ok) {
                throw new Error('Location not found. Try another city.');
            }
            
            const data = await response.json();
            displayWeatherData(data, selectedOptions);
        } catch (error) {
            showError(error.message);
        } finally {
            showLoading(false);
        }
    }
    
    // Display weather data
    function displayWeatherData(data, selectedOptions) {
        // Set weather theme based on conditions
        setWeatherTheme(data.weather[0].main);
        
        // Current weather display
        currentWeatherSection.innerHTML = `
            <div class="weather-info">
                <h2 class="location-name">${data.name}, ${data.sys.country}</h2>
                <div class="weather-description">${data.weather[0].description}</div>
                <img class="weather-icon" src="https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png" alt="${data.weather[0].description}">
                <div class="temperature">${Math.round(data.main.temp)}°C</div>
                <div class="weather-meta">
                    <span>H: ${Math.round(data.main.temp_max)}°</span>
                    <span>L: ${Math.round(data.main.temp_min)}°</span>
                </div>
            </div>
        `;
        
        // Weather details
        let detailsHTML = '<div class="detail-grid">';
        
        selectedOptions.forEach(option => {
            switch(option) {
                case 'temp':
                    detailsHTML += createDetailCard(
                        'fas fa-temperature-high',
                        'Temperature',
                        `${data.main.temp}°C`
                    );
                    break;
                case 'feels_like':
                    detailsHTML += createDetailCard(
                        'fas fa-temperature-low',
                        'Feels Like',
                        `${data.main.feels_like}°C`
                    );
                    break;
                case 'humidity':
                    detailsHTML += createDetailCard(
                        'fas fa-tint',
                        'Humidity',
                        `${data.main.humidity}%`
                    );
                    break;
                case 'pressure':
                    detailsHTML += createDetailCard(
                        'fas fa-tachometer-alt',
                        'Pressure',
                        `${data.main.pressure} hPa`
                    );
                    break;
                case 'wind':
                    detailsHTML += createDetailCard(
                        'fas fa-wind',
                        'Wind Speed',
                        `${data.wind.speed} m/s`
                    );
                    if (data.wind.gust) {
                        detailsHTML += createDetailCard(
                            'fas fa-wind',
                            'Wind Gust',
                            `${data.wind.gust} m/s`
                        );
                    }
                    detailsHTML += createDetailCard(
                        'fas fa-compass',
                        'Wind Direction',
                        `${data.wind.deg}°`
                    );
                    break;
                case 'visibility':
                    detailsHTML += createDetailCard(
                        'fas fa-eye',
                        'Visibility',
                        `${(data.visibility / 1000).toFixed(1)} km`
                    );
                    break;
                case 'sunrise':
                    detailsHTML += createDetailCard(
                        'fas fa-sun',
                        'Sunrise',
                        new Date(data.sys.sunrise * 1000).toLocaleTimeString()
                    );
                    break;
                case 'sunset':
                    detailsHTML += createDetailCard(
                        'fas fa-moon',
                        'Sunset',
                        new Date(data.sys.sunset * 1000).toLocaleTimeString()
                    );
                    break;
            }
        });
        
        detailsHTML += '</div>';
        weatherDetailsSection.innerHTML = detailsHTML;
    }
    
    // Create detail card HTML
    function createDetailCard(icon, label, value) {
        return `
            <div class="detail-card">
                <i class="${icon}"></i>
                <div class="detail-value">${value}</div>
                <div class="detail-label">${label}</div>
            </div>
        `;
    }
    
    // Set weather theme based on conditions
    function setWeatherTheme(weatherCondition) {
        const weatherDisplay = document.querySelector('.weather-display');
        
        // Remove all weather classes
        weatherDisplay.classList.remove(
            'weather-sunny',
            'weather-cloudy',
            'weather-rainy',
            'weather-snowy',
            'weather-thunderstorm',
            'weather-mist'
        );
        
        // Add appropriate class
        switch(weatherCondition.toLowerCase()) {
            case 'clear':
                weatherDisplay.classList.add('weather-sunny');
                break;
            case 'clouds':
                weatherDisplay.classList.add('weather-cloudy');
                break;
            case 'rain':
            case 'drizzle':
                weatherDisplay.classList.add('weather-rainy');
                break;
            case 'snow':
                weatherDisplay.classList.add('weather-snowy');
                break;
            case 'thunderstorm':
                weatherDisplay.classList.add('weather-thunderstorm');
                break;
            case 'mist':
            case 'smoke':
            case 'haze':
            case 'fog':
                weatherDisplay.classList.add('weather-mist');
                break;
            default:
                // Default styling
        }
    }
    
    // Fetch location suggestions
    async function fetchLocationSuggestions(query) {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`
            );
            
            const data = await response.json();
            displaySuggestions(data);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    }
    
    // Display location suggestions
    function displaySuggestions(suggestions) {
        if (suggestions.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        suggestionsContainer.innerHTML = suggestions
            .map(loc => `
                <div class="suggestion-item" data-lat="${loc.lat}" data-lon="${loc.lon}">
                    ${loc.name}, ${loc.country} ${loc.state ? `, ${loc.state}` : ''}
                </div>
            `)
            .join('');
        
        suggestionsContainer.style.display = 'block';
        
        // Add click event to suggestions
        document.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', function() {
                locationInput.value = this.textContent.trim();
                suggestionsContainer.style.display = 'none';
                fetchWeatherData();
            });
        });
    }
    
    // Show loading overlay
    function showLoading(show) {
        if (show) {
            loadingOverlay.classList.add('active');
        } else {
            loadingOverlay.classList.remove('active');
        }
    }
    
    // Show error message
    function showError(message) {
        currentWeatherSection.innerHTML = `
            <div class="welcome-message">
                <h2>Error</h2>
                <p>${message}</p>
            </div>
        `;
        weatherDetailsSection.innerHTML = '';
    }
    
    // Initialize with default weather (optional)
    // locationInput.value = 'London';
    // fetchWeatherData();
});