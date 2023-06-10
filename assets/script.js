$(function () {
  // Open Weather Api key with const created for localStorage history, search and locate buttons. 
  const apiKey = '02045eae6d8bdfcc80db71ad84fd66e3'; 
  const historyEl = $("#history");
  const searchInputEl = $("#searchInput");
  const locateBtnEl = $("#locateBtn"); 
  // created variable that parse localStorage to get "history" of cities searched by user.
  let searchHistory = JSON.parse(localStorage.getItem("history")) || []; 
  let weatherData;
  
  // function to initiate autocomplete API through user searchInput
  function initAutocomplete() {
    const searchInputEl = document.getElementById('searchInput');
    const autocomplete = new google.maps.places.Autocomplete(searchInputEl);

    autocomplete.addListener('place_changed', function () {
      const place = autocomplete.getPlace();
      const city = getAddressComponent(place.address_components, 'locality');
      const state = getAddressComponent(place.address_components, 'administrative_area_level_1');
      const country = getAddressComponent(place.address_components, 'country');
      console.log(country)
      const fullAddress = [city, state, country].filter(Boolean).join(', ');

      fetchWeatherData(fullAddress);
      storeSearchHistory(fullAddress);
      // clear input field after user submission and replacing d-none class with d-flex.
      searchInputEl.value = ''; 
      $('#weathers').removeClass('d-none').addClass('d-flex');
    });
  }

  // Call the function to initialise autocomplete
  initAutocomplete();

  // function to featch weather data using openweather API. fetching currentweather and forecast weather arrays.
  function fetchWeatherData(searchInput) {
    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${searchInput}&appid=${apiKey}`;
    const forecastWeatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${searchInput}&appid=${apiKey}`;
    
    // if condition statement that creates variable values so long as user submission is not empty.
    if (searchInput !== "") {
      let today = new Date();
      let dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][today.getDay()];
      let month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][today.getMonth()];
      let formattedDate = `${dayOfWeek} ${month} ${today.getDate()}, ${today.getFullYear()}`;
      
      // fetch request to the currentweatherURL. If successfull the done call back is executed which will create a weatherData object for the current day
      // weather forecast. It will also update the city-name, temp, wind, humidity, and current weather icon if the fetch is successful.
      $.getJSON(currentWeatherUrl)
        .done(function (currentData) {
          // console log to review parameter settings.
          console.log(currentData) 
          var weatherIcon = currentData.weather[0].icon;
          weatherData = {
            temp: convertToFahrenheit(currentData.main.temp),
            wind: convertToMilesPerHour(currentData.wind.speed),
            humidity: currentData.main.humidity,
            icon: weatherIcon
          };
          //Append texts to the targets below:
          $("#city-name").text(`Today in ${searchInput}, ${formattedDate}`);
          $("#temp").text(`Temperature: ${weatherData.temp.toFixed(0)} °F`); 
          $("#wind").text(`Wind Speed: ${weatherData.wind.toFixed(0)} MPH`); 
          $("#humidity").text(`Humidity: ${weatherData.humidity}%`);
          $("#current-pic").attr("src", `https://openweathermap.org/img/wn/${weatherData.icon}@4x.png`);
  
          storeSearchHistory(searchInput); 
        })
  
        .fail(function (alertModal) { 
          var alertModal = new bootstrap.Modal(document.getElementById('alertModal'), {}); 
          alertModal.show(); 
          return;
        });
      // fetch request to forecastWeatherURL API. If successful functions getForecast, renderCities, and storeSearchHistory are called.
      $.getJSON(forecastWeatherUrl)
        .done(function (forecastData) {
          getForecast(weatherData, forecastData);
          renderCities();
  
          storeSearchHistory(searchInput);
        })
        // if fail, console log fail.
        .fail(function (error) { 
          console.log(error)
          return;cityName
        });
    }
  }
  
  
  function getCurrentCity() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          const locationUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`;
  
          $.getJSON(locationUrl)
            .done(data => {
              const cityName = data[0].name;
              resolve(cityName);
            })
            .fail(error => {
              reject(error);
            });
        },
        error => {
          reject(error);
        }
      );
    });
  }
  
  function handleLocateButtonClick() {
    getCurrentCity()
      .then(cityName => {
        // Set the current city name in the search input
        searchInputEl.val(cityName);
        // Fetch weather data for the current city
        fetchWeatherData(cityName); 
        // Show the weather section
        $('#weathers').removeClass('d-none').addClass('d-flex');
        // clear searchInput field.
        searchInputEl.empty(); 
      })
      .catch(error => {
        console.log(error);
      });
  }
  
  locateBtnEl.on('click', handleLocateButtonClick);  
  function convertToFahrenheit(kelvin) {
    return (kelvin - 273.15) * 9 / 5 + 32; 
  }
  
  function convertToMilesPerHour(mps) { 
    return mps * 2.23694;
  }
  
  function getForecast(currentWeather, forecastData) {
    $("#searchInput").val('');
    // Get the forecast container element.
    const forecastContainer = $("#forecast");
    // Empty the forecast container.
    forecastContainer.empty();
    // Get the daily data from the forecast data.
    let dailyData = forecastData.list.filter(item => item.dt_txt.includes("00:00:00")); 
    console.log(dailyData) 
    for (let i = 0; i < dailyData.length; i++) { 
      const forecast = dailyData[i];
      const forecastDate = new Date(forecast.dt_txt);
      const forecastTemperature = convertToFahrenheit(forecast.main.temp);
      const forecastWind = convertToMilesPerHour(forecast.wind.speed);
      const forecastHumidity = forecast.main.humidity;
      const forecastIcon = forecast.weather[0].icon;
      const date = new Date(forecastDate); 
      const day = date.getDate();
      const month = date.getMonth() + 1; 
      const year = date.getFullYear();
      const shortDate = `${month}/${day}/${year}`; 
      const dayOfWeek = new Date(shortDate).getDay();
      const daysOfTheWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      
      //create the forecast card element and its content. Will have day of week, date, weather icon, temp, wind, and humidity.
      const forecastCard = $("<div>").addClass("col forecast m-1 bg-secondary bg-gradient text-white rounded");
      const forecastContent = $("<div>").addClass("col") 
        .append($("<p>").addClass("mt-2 fs-4").text(daysOfTheWeek[dayOfWeek]))
        .append($("<p>").addClass("mt-2 fs-4").text(shortDate))
        .append($("<img>").attr("src", `https://openweathermap.org/img/wn/${forecastIcon}@2x.png`)) 
        .append($("<p>").text(`Temp: ${forecastTemperature.toFixed(0)} °F`)) 
        .append($("<p>").text(`Wind: ${forecastWind.toFixed(0)} MPH`)) 
        .append($("<p>").text(`Humidity: ${forecastHumidity}%`));
  
      forecastCard.append(forecastContent);
      forecastContainer.append(forecastCard);
    }
  }
  
  function formatInput(input) { 
    let words = input.toLowerCase().split(' ');
    for (let i = 0; i < words.length; i++) {
      words[i] = words[i][0].toUpperCase() + words[i].substr(1);
    }
    return words.join(' ');
  }
  
  function handleFormSubmit(event) {
    event.preventDefault();
    var searchInput = formatInput(searchInputEl.val().trim());
  
    if (searchInput !== "") {
      fetchWeatherData(searchInput);
      searchInputEl.val("");
    }
  }
  
    $('#searchInput').on('keypress', function (event) {
      if (event.which === 13) {
        event.preventDefault();
        handleFormSubmit(event);
        $('#weathers').removeClass('d-none').addClass('d-flex'); 
        $('#searchInput').val(''); 
      }
    });
  
    $('#searchBtn').on('click', function (event) {
      var searchInput = searchInputEl.val().trim();
      if (searchInput === "") {
        return;
      }
      handleFormSubmit(event);
      $('#weathers').removeClass('d-none').addClass('d-flex'); 
      $('#searchInput').val(''); 
    });
    
    function renderCities() {
      // Empty the history element
      historyEl.empty();
      // Loop through the search history
      for (var i = searchHistory.length - 1; i >= 0; i--) {
        // Get the city input
        var cityInput = searchHistory[i];
        // Create a new list item
        var cityDiv = $("<li>").addClass("list-group-item").text(cityInput);
        // Add an onclick event listener to the list item
        cityDiv.on("click", function() {
          // Fetch the weather data for the city
          fetchWeatherData($(this).text());
        });
        // Append the list item to the history element
        historyEl.append(cityDiv);
      }
    }
    // This function is called when the user clicks on the "Clear" button.
    // It clears the local storage, the search history, and the search input field.
    // It also hides the weather forecast.
    $("#clearBtn").on("click", function () { 
      localStorage.clear();
      searchHistory = [];
      renderCities();
      $("#searchInput").val('');
      $("#weathers").removeClass("d-flex").addClass("d-none");
    });
    // This function stores the user's search input in the local storage.
    // It first formats the input by removing any spaces. Then, it checks to see if the input is already in the search history.
    // If it is, it does nothing. Otherwise, it pushes the input onto the search history.
    // The search history is limited to 5 items. Finally, it updates the local storage and renders the list of cities.
    function storeSearchHistory(searchInput) {
      searchInput = formatInput(searchInput);
  
      if (searchHistory.includes(searchInput)) {
        return;
      }
      searchHistory.push(searchInput);
      if (searchHistory.length > 5) {
        searchHistory = searchHistory.slice(-5);
      }
      localStorage.setItem("Search History", JSON.stringify(searchHistory));
      localStorage.setItem("Current City", searchInput);
      renderCities();
    }
    // This function initializes the application.
    // It first checks to see if there is any search history stored in the local storage.
    // If there is, it loads the search history and renders the list of cities.
    // It also fetches the weather data for the last searched city and displays it.
    function init() {
      if (localStorage.getItem("Search History")) {
        searchHistory = JSON.parse(localStorage.getItem("Search History"));
        renderCities();
  
        let lastSearchedCity = searchHistory[searchHistory.length - 1];
        if (lastSearchedCity) {
          fetchWeatherData(lastSearchedCity);
          $("#weathers").removeClass("d-none").addClass("d-flex");
        }
      }
    }
  
    init();
    // This function is called when the user mouses over a city in the list.
    // It changes the background color of the city to dark-blue and the text color to white.
    // Lastly, when mouse leavesbutton area it sets button to original style settings.
    $(document).on({ 
      mouseenter: function () {
        $(this).css('background-color', '#27374D');
        $(this).css('color', '#ffffff');
      },
      mouseleave: function () {
        $(this).css('background-color', '');
        $(this).css('color', '');
        $(this).css('opacity', '100%');
      }
    },
      'li.list-group-item' 
    );
  });
