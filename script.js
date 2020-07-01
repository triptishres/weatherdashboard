let searchBar = $("#search-bar");
let searchButton = $("#search-btn");
let searchHistory = $("#search-history");
let weatherCol = $("#weather-col");

const apiKey = "a956820ac7047dfb2ca0c4341e3e34c1";
let currentWeatherUrl;
let forecastUrl;
let storedSearches = [];

//Populating stored searches from local storage
let tempStoredSearches = localStorage.getItem("storedSearches");
if (tempStoredSearches != null)
    storedSearches = tempStoredSearches.split(",");

//Createing current date variable
let today = new Date();
let currentDate = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();


function populateCurrentWeather() {

    $.ajax({
        url: currentWeatherUrl,
        method: "GET"
    }).then(function(response) {

        //Object to store current weather data
        let currentWeatherObj = {
            location: response.name,
            date: currentDate,
            weatherIcon: response.weather[0].icon,
            temperature: Math.round(response.main.temp),
            humidity: response.main.humidity,
            wind: response.wind.speed,
            uvIndex: 0,
            uvIntensity: ""
        };

        //Formatting the date for the object 
        currentWeatherObj.date = formatDates(currentWeatherObj.date);

        //Calling to get UV index 
        let latitude = response.coord.lat;
        let longitude = response.coord.lon;
        let currentUvUrl = "https://api.openweathermap.org/data/2.5/uvi?lat=" + latitude + "&lon=" + longitude + "&appid=" + apiKey;

        $.ajax({
            url: currentUvUrl,
            method: "GET"
        }).then(function(response2) {

            currentWeatherObj.uvIndex = response2.value;

            //Assigning uvIntensity based on the uvIndex number (will be used for CSS styling)
            if (currentWeatherObj.uvIndex >= 5)
                currentWeatherObj.uvIntensity = "high";
            else if (currentWeatherObj.uvIndex < 3)
                currentWeatherObj.uvIntensity = "low";
            else
                currentWeatherObj.uvIntensity = "medium";

            //Generating a card for all current weather info and appending it to the weather-col element
            let currentWeatherCard = $('<div class="card"><div class="card-body"><h5 class="card-title">' + currentWeatherObj.location + ' (' + currentWeatherObj.date + ') ' +
                '<span class="badge badge-primary"><img id="weather-icon" src="http://openweathermap.org/img/wn/' + currentWeatherObj.weatherIcon + '@2x.png"></span></h5>' +
                '<p class="card-text">Temperature: ' + currentWeatherObj.temperature + ' °F</p>' +
                '<p class="card-text">Humidity: ' + currentWeatherObj.humidity + '%</p>' +
                '<p class="card-text">Wind Speed: ' + currentWeatherObj.wind + ' MPH</p>' +
                '<p class="card-text">UV Index: <span class="badge badge-secondary ' + currentWeatherObj.uvIntensity + '">' + currentWeatherObj.uvIndex + '</span>')
            $("#weather-col").append(currentWeatherCard);
        });

        renderStoredSearches();

    });
}

function populateFutureWeather() {

    let fiveDayForecastArray = [];

    //Five day forecast API call
    $.ajax({
        url: forecastUrl,
        method: "GET"
    }).then(function(response) {

        console.log(response);

        let temporaryForecastObj;

        //Getting the weather data for around 24 hours after the API call, and 24 hours after that for the five day forecast, then populates forecast array
        for (let i = 4; i < response.list.length; i += 8) {
            temporaryForecastObj = {
                date: response.list[i].dt_txt.split(" ")[0],
                weatherIcon: response.list[i].weather[0].icon,
                temperature: Math.round(response.list[i].main.temp),
                humidity: response.list[i].main.humidity
            };
            fiveDayForecastArray.push(temporaryForecastObj);
        }

        //Formatting dates for every object in the array
        for (let i = 0; i < fiveDayForecastArray.length; i++) {
            fiveDayForecastArray[i].date = formatDates(fiveDayForecastArray[i].date);
        }

        //Creating HTML elements to populate page with forecast data
        let forecastHeader = $('<h5>5-Day Forecast:</h5>');
        $("#forecast-header").append(forecastHeader);

        for (let i = 0; i < fiveDayForecastArray.length; i++) {
            let forecastCard = $('<div class="col-lg-2 col-sm-3 mb-1"><span class="badge badge-primary"><h5>' + fiveDayForecastArray[i].date + '</h5>' +
                '<p><img class="w-120" src="http://openweathermap.org/img/wn/' + fiveDayForecastArray[i].weatherIcon + '@2x.png"></p>' +
                '<p>Temp: ' + fiveDayForecastArray[i].temperature + '°F</p>' +
                '<p>Humidity: ' + fiveDayForecastArray[i].humidity + '%</p>' +
                '<span></div>');
            $("#forecast-row").append(forecastCard);
        }


    });
}

function renderStoredSearches() {

    $("#search-history").empty();

    //If the search bar value is not empty, adds the value to the front of the storedSearches array
    //Also checking if the value is a duplicate value and repositions the value to the front of the array if it is
    if ($("#search-bar").val() != "") {
        if (storedSearches.indexOf($("#search-bar").val()) != -1) {
            storedSearches.splice(storedSearches.indexOf($("#search-bar").val()), 1)
        }
        storedSearches.unshift($("#search-bar").val());
    }

    //Saving storedSearches to local storage
    localStorage.setItem("storedSearches", storedSearches);

    //Creating search history list items to show under the search bar
    for (let i = 0; i < storedSearches.length; i++) {
        let newListItem = $('<li class="list-group-item">' + storedSearches[i] + '</li>');
        $("#search-history").append(newListItem);
    }

    //Allowing user to search for list items they click on
    $("li").on("click", function() {
        $("#search-bar").val($(event.target).text());
        searchButton.click();
    });
}

//Changing the date to month/day/year format
function formatDates(data) {
    let dateArray = data.split("-");
    let formattedDate = dateArray[1] + "/" + dateArray[2] + "/" + dateArray[0];
    return formattedDate
}

searchButton.on("click", function() {

    currentWeatherUrl = "https://api.openweathermap.org/data/2.5/weather?q=" + searchBar.val() + "&units=imperial&appid=" + apiKey;

    forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?q=" + searchBar.val() + "&units=imperial&appid=" + apiKey;

    $("#weather-col").empty();
    $("#forecast-header").empty();
    $("#forecast-row").empty();

    populateCurrentWeather();
    populateFutureWeather();
});

//Alowing user to press enter in the search bar to search
$("#search-bar").keypress(function() {
    if (event.keyCode == 13)
        searchButton.click();
});



renderStoredSearches();