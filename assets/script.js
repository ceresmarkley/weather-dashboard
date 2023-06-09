$(function () {
    const apiKey = '02045eae6d8bdfcc80db71ad84fd66e3'; //Open Weather API Key
    const historyEl = $("#history");
    const searchInputEl = $("#searchInput");
    const locateBtnEl = $("#locateBtn"); // Locate button element
  
    let searchHistory = JSON.parse(localStorage.getItem("history")) || []; //get search history from localStorage if there's any
    let weatherData;

    function getAddressComponent(components, type) {
      for (let i = 0; i < components.length; i++) {
      if (components[i].types.includes(type)) {
        if (type === 'country') {
          return components[i].short_name;
        } else {
          return components[i].long_name;
        }
      }
    }
      return null;
    }
  
    function fetchWeatherData(searchInput) {
      const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${searchInput}&appid=${apiKey}`;
      const forecastWeatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${searchInput}&appid=${apiKey}`;
  
      if (searchInput !== "") {
        let today = new Date();
        let dayOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][today.getDay()];
        let month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][today.getMonth()];
        let formattedDate = `${dayOfWeek} ${month} ${today.getDate()}, ${today.getFullYear()}`;
  
        $.getJSON(currentWeatherUrl)
          .done(function (currentData) {
            console.log(currentData) //check to see how the parameters are structured.
            var weatherIcon = currentData.weather[0].icon;
            weatherData = {
              temp: convertToFahrenheit(currentData.main.temp),
              wind: convertToMilesPerHour(currentData.wind.speed),
              humidity: currentData.main.humidity,
              icon: weatherIcon
            };
            //Append texts to the targets below:
            $("#city-name").text(`Today in ${searchInput}, ${formattedDate}`);
            $("#temp").text(`Temperature: ${weatherData.temp.toFixed(0)} °F`); //round to zero decimals, no one needs the two decimal lol
            $("#wind").text(`Wind Speed: ${weatherData.wind.toFixed(0)} MPH`); //round to zero decimals, no one needs the two decimal lol
            $("#humidity").text(`Humidity: ${weatherData.humidity}%`);
            $("#current-pic").attr("src", `https://openweathermap.org/img/wn/${weatherData.icon}@4x.png`);
  
            storeSearchHistory(searchInput); //only store the search inputs into search history when data passes since it's inside of the .done
          })
  
          .fail(function (alertModal) { //here I changed changed from error to alertModal for when the response fails
            var alertModal = new bootstrap.Modal(document.getElementById('alertModal'), {}); // get the element from html
                      alertModal.show(); //show alertModal when response fails, this why it includes more than just 404
                      return;
          });
  
        $.getJSON(forecastWeatherUrl)
          .done(function (forecastData) {
            getForecast(weatherData, forecastData);
            renderCities();
  
            storeSearchHistory(searchInput);
          })
  
          .fail(function (error) { // we do not need to make the modal function again here since a valid city name wont fetch neither current or forecast weather.
            console.log(error)
            return;
          });
      }
    }
  
    // Function to get the current city name
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
        })
        .catch(error => {
          console.log(error);
        });
    }
  
    locateBtnEl.on('click', handleLocateButtonClick);
  
    function convertToFahrenheit(kelvin) {
      return (kelvin - 273.15) * 9 / 5 + 32; //Original data is in kelvin, convert it to F
    }
  
    function convertToMilesPerHour(mps) { //Original data is in meters/second, convert it fo miles per hour
      return mps * 2.23694;
    }
  
    function getForecast(currentWeather, forecastData) {
      const forecastContainer = $("#forecast");
      forecastContainer.empty();
  
      let dailyData = forecastData.list.filter(item => item.dt_txt.includes("00:00:00")); // get rid off the times in the string
      console.log(dailyData) //I log the dailyData to check the arrays
      for (let i = 0; i < dailyData.length; i++) { //noon is the cut off time, date and time of O go to the next day at noon,
        const forecast = dailyData[i];
        const forecastDate = new Date(forecast.dt_txt);
        const forecastTemperature = convertToFahrenheit(forecast.main.temp);
        const forecastWind = convertToMilesPerHour(forecast.wind.speed);
        const forecastHumidity = forecast.main.humidity;
        const forecastIcon = forecast.weather[0].icon;
        const date = new Date(forecastDate); //make a shorter date format so that it will fit in the cards
        const day = date.getDate();
        const month = date.getMonth() + 1; //month array starts at 0 so add 1 for Jan
        const year = date.getFullYear();
        const shortDate = `${month}/${day}/${year}`; //put them together can name it shortDate
        const dayOfWeek = new Date(shortDate).getDay();
        const daysOfTheWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
        const forecastCard = $("<div>").addClass("col forecast m-1 bg-secondary bg-gradient text-white rounded");
        const forecastContent = $("<div>").addClass("col") //add the class col to make the cards display evenly regardless screensize
          .append($("<p>").addClass("mt-2 fs-4").text(daysOfTheWeek[dayOfWeek]))
          .append($("<p>").addClass("mt-2 fs-4").text(shortDate))
          .append($("<img>").attr("src", `https://openweathermap.org/img/wn/${forecastIcon}@2x.png`)) //make the icon 2x size
          .append($("<p>").text(`Temp: ${forecastTemperature.toFixed(0)} °F`)) //round to no decimals
          .append($("<p>").text(`Wind: ${forecastWind.toFixed(0)} MPH`)) //round to no decimals
          .append($("<p>").text(`Humidity: ${forecastHumidity}%`));
  
        forecastCard.append(forecastContent);
        forecastContainer.append(forecastCard);
      }
    }
  
    function formatInput(input) { //make a function to ensure all inputs are recordede with first letter capitalized in each word
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
        $('#weathers').removeClass('d-none').addClass('d-flex'); //display the weathers when enter is pressed
        $('#searchInput').val(''); //clean the input box and ready it for new inputs
      }
    });
  
    $('#searchBtn').on('click', function (event) {
      var searchInput = searchInputEl.val().trim();
      if (searchInput === "") {
        return;
      }
      handleFormSubmit(event);
      $('#weathers').removeClass('d-none').addClass('d-flex'); //also display the weather when search is submitted
      $('#searchInput').val(''); //also clean out the input for incoming inputs
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
  
    $("#clearBtn").on("click", function () { //make a clear button to clear all histories
      localStorage.clear();
      searchHistory = [];
      renderCities();
      $("#searchInput").val('');
      $("#weathers").removeClass("d-flex").addClass("d-none");
    });
  
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
  
    $(document).on({ //first try to use javascript to add a css class within jQuery
      mouseenter: function () {
        $(this).css('background-color', '#0d6efd');
        $(this).css('color', '#ffffff');
        $(this).css('opacity', '75%');
      },
      mouseleave: function () {
        $(this).css('background-color', '');
        $(this).css('color', '');
        $(this).css('opacity', '100%');
      }
    },
      'li.list-group-item' //targeting the li in the list-group-item
    );
  });