/*
 *      Copyright (c) 2016 Samsung Electronics Co., Ltd
 *
 *      Licensed under the Flora License, Version 1.1 (the "License");
 *      you may not use this file except in compliance with the License.
 *      You may obtain a copy of the License at
 *
 *              http://floralicense.org/license/
 *
 *      Unless required by applicable law or agreed to in writing, software
 *      distributed under the License is distributed on an "AS IS" BASIS,
 *      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *      See the License for the specific language governing permissions and
 *      limitations under the License.
 */

(function() {
    /**
     * ARR_COLOR - Color string array for displaying air pollution and battery level.
     * ARR_MONTH - Month string array for displaying month-text.
     * URL_WEATHER_DATA - Address of file contains weather information.
     * URL_AIR_POLLUTION_DATA - Address of file contains air pollution information.
     * battery - Object contains the devices's battery information.
     * updateTimer - Object contains date update timer
     */
    var ARR_COLOR = ["red", "orange", "yellow", "green", "blue"],
        ARR_MONTH = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"],
        //If you want to get weather data from another file or API, change this part.
        URL_WEATHER_DATA = "./data/weatherData.json",
        //If you want to get air pollution data from another file or API, change this part.
        URL_AIR_POLLUTION_DATA = "./data/airPollutionData.xml",
        battery = navigator.battery || navigator.webkitBattery || navigator.mozBattery,
        updateTimer;

    /**
     * Rotates element.
     * @private
     * @param {object} digitElement - The object to slide
     * @param {number} digitToShow - The digit to display
     */
    function slideDigit(digitElement, digitToShow) {
    		// There are 12 digits on the strip. The first and last one are extra ones which are only shown partially.
    		var digitSizePx = 903 / 12.0;
    		var constantOffset = 110 - 46; // Positions the first number to the center of the background
    		
    		var currentDigit = Math.floor(digitToShow);
    		
    		var currentDigitRemainder = digitToShow % 1.0;
    		
    		var finalOffset = currentDigit + currentDigitRemainder * currentDigitRemainder * currentDigitRemainder * currentDigitRemainder;
    		
    		digitElement.style.top = -(finalOffset) * digitSizePx + constantOffset  + "px";
    }

    /**
     * Updates the current time.
     * @private
     */
    function updateTime() {
        var dateTime = tizen.time.getCurrentDateTime(),
            secondToday = dateTime.getSeconds() + dateTime.getMinutes() * 60 + dateTime.getHours() * 3600,
            minDigitLeft = document.querySelector("#time-min-digit-left"),
            minDigitRight = document.querySelector("#time-min-digit-right"),
            hourDigitLeft = document.querySelector("#time-hour-digit-left"),
            hourDigitRight = document.querySelector("#time-hour-digit-right");

        var minutesNow = (secondToday % 3600) / 60;
        var hourNow = (secondToday / 3600);
        	slideDigit(minDigitRight, minutesNow % 10.0);
        	slideDigit(minDigitLeft, minutesNow / 10.0);
        	slideDigit(hourDigitRight,  hourNow % 10.0);
        	slideDigit(hourDigitLeft, hourNow / 10.0);
    }

    /**
     * Updates the current month and date.
     * @private
     * @param {number} prevDate - The date of previous day
     */
    function updateDate(prevDate) {
        var dateTime = tizen.time.getCurrentDateTime(),
            month = dateTime.getMonth(),
            date = dateTime.getDate(),
            elMonthStr = document.querySelector("#calendar-month"),
            elDateStr = document.querySelector("#calendar-date"),
            nextInterval;

        /**
         * Check the update condition.
         * If prevDate is "0", it will always update the date.
         */
        if (prevDate !== null) {
            if (prevDate === date) {
                /**
                 * If the date was not changed (meaning that something went wrong),
                 * call updateDate again after a second.
                 */
                nextInterval = 1000;
            } else {
                /**
                 * If the day was changed,
                 * call updateDate at the beginning of the next day.
                 */
                nextInterval =
                    (23 - dateTime.getHours()) * 60 * 60 * 1000 +
                    (59 - dateTime.getMinutes()) * 60 * 1000 +
                    (59 - dateTime.getSeconds()) * 1000 +
                    (1000 - dateTime.getMilliseconds()) +
                    1;
            }
        }

        elMonthStr.innerHTML = ARR_MONTH[month];
        elDateStr.innerHTML = date;

        // If an updateDate timer already exists, clear the previous timer.
        if (updateTimer) {
            clearTimeout(updateTimer);
        }

        // Set next timeout for date update.
        updateTimer = setTimeout(function() {
            updateDate(date);
        }, nextInterval);
    }

    /**
     * When fail to get location data or weather, air pollution data,
     * sets disable icon (GPS or WiFi).
     * @private
     * @param {string} iconName - The icon name for displaying
     */
    function setDisableIcon(iconName) {
        var elAirPollIcon = document.querySelector("#air-icon"),
            elAirPollStatus = document.querySelector("#air-status"),
            elAirPollText = document.querySelector("#air-text");

        elAirPollStatus.style.backgroundImage = "url('./image/no_" + iconName + "_icon.png')";
        elAirPollIcon.style.backgroundImage = "";
        elAirPollText.innerHTML = "";
    }

    /**
     * Updates weather icon, status and text.
     * @private
     */
    function updateWeather() {
        /**
         * xmlHttp - XMLHttpRequest object for get information about weather
         */
        var xmlHttp = new XMLHttpRequest(),
            weatherInform,
            elWeatherIcon = document.querySelector("#weather-icon"),
            elWeatherText = document.querySelector("#weather-text"),
            weatherIcon,
            weatherText;

        xmlHttp.overrideMimeType("application/json");
        xmlHttp.open("GET", URL_WEATHER_DATA, false);
        xmlHttp.onreadystatechange = function() {
            // Checks responseText isn't empty
            if (xmlHttp.responseText) {
                // Parses responseText to JSON
                weatherInform = JSON.parse(xmlHttp.responseText);
                // Gets icon code from information
                weatherIcon = weatherInform.weather[0].icon;
                // Gets weather string from information
                weatherText = weatherInform.weather[0].main;

                elWeatherIcon.style.backgroundImage = "url('./image/weather_icon/" + weatherIcon + ".png')";
                elWeatherText.innerHTML = weatherText;
            }
            // If reponseText is empty, set no wifi icon.
            else {
                setDisableIcon("wifi");
            }
        };

        xmlHttp.send();
    }

    /**
     * Updates air pollution icon, status and text.
     * @private
     */
    function updateAirPolution() {
        /**
         * xmlHttp - XMLHttpRequest object for get information about air pollution
         */
        var xmlHttp = new XMLHttpRequest(),
            airPollutionInform,
            elAirPollIcon = document.querySelector("#air-icon"),
            elAirPollStatus = document.querySelector("#air-status"),
            elAirPollText = document.querySelector("#air-text"),
            airPollLevel,
            airPollGrade,
            statusColor;

        xmlHttp.open("GET", URL_AIR_POLLUTION_DATA, false);
        xmlHttp.onreadystatechange = function() {
            // Checks responseXML isn't empty
            if (xmlHttp.responseXML) {
                airPollutionInform = xmlHttp.responseXML;
                // Gets air pollution level from pm10value node in responseXML
                airPollLevel = airPollutionInform.getElementsByTagName("pm10Value")[0].childNodes[0].nodeValue;
                elAirPollText.innerHTML = airPollLevel;

                if (airPollLevel === "-") {
                    airPollGrade = 4;
                } else {
                    elAirPollText.innerHTML += "AQI";
                    if (airPollLevel < 50) {
                        airPollGrade = 4;
                    } else if (airPollLevel < 150) {
                        airPollGrade = 3;
                    } else if (airPollLevel < 200) {
                        airPollGrade = 2;
                    } else if (airPollLevel < 300) {
                        airPollGrade = 1;
                    } else {
                        airPollGrade = 0;
                    }
                }

                statusColor = ARR_COLOR[airPollGrade];
                elAirPollIcon.style.backgroundImage = "url('./image/color_status/air_pollution_icon_" + statusColor + ".png')";
                elAirPollStatus.style.backgroundImage = "url('./image/color_status/" + statusColor + "_indicator.png')";
            }
            // If reponseXML is empty, set no wifi icon.
            else {
                setDisableIcon("wifi");
            }
        };

        xmlHttp.send();
    }

    /**
     * Updates battery icon and text.
     * @private
     */
    function updateBattery() {
        var elBatteryIcon = document.querySelector("#battery-icon"),
            elBatteryStatus = document.querySelector("#battery-status"),
            elBatteryText = document.querySelector("#battery-text"),
            batteryLevel = Math.floor(battery.level * 100),
            batteryGrade = Math.floor(batteryLevel / 20),
            statusColor = ARR_COLOR[batteryGrade];

        elBatteryIcon.style.backgroundImage = "url('./image/color_status/battery_icon_" + statusColor + ".png')";
        elBatteryStatus.style.backgroundImage = "url('./image/color_status/" + statusColor + "_indicator.png')";
        elBatteryText.innerHTML = batteryLevel + "%";
    }

    /**
     * Updates date and time.
     * @private
     */
    function updateWatch() {
        updateDate();
        updateTime();
    }

    /**
     * Update weather and air pollution information.
     * If can't get location information, displays no GPS icon.
     * @private
     */
    function updateInformation() {
        navigator.geolocation.getCurrentPosition(
            function() {
                updateWeather();
                updateAirPolution();
            },
            setDisableIcon("gps"));
    }

    /**
     * Changes display attribute of two elements when occur click event
     * @private
     * @param {object} element1 - The first element id for changing display
     * @param {object} element2 - The second element id for changing display
     */
    function toggleElement(element1, element2) {
        if (document.querySelector(element1).style.display === "none") {
            document.querySelector(element1).style.display = "block";
            document.querySelector(element2).style.display = "none";
        } else {
            document.querySelector(element1).style.display = "none";
            document.querySelector(element2).style.display = "block";
        }
    }

    /**
     * Binds events.
     * @private
     */
    function bindEvents() {
        /**
         * elBattery - Element contains battery icon, status and text
         * elAir - Element contains air pollution icon, status and text
         */
        var elBattery = document.querySelector("#body-battery"),
            elAir = document.querySelector("#body-air");

        // Adds eventListener to update the screen immediately when the device wakes up.
        document.addEventListener("visibilitychange", function() {
            if (!document.hidden) {
                updateWatch();
                updateInformation();
            }
        });

        // Adds event listeners to update watch screen when the time zone is changed.
        tizen.time.setTimezoneChangeListener(function() {
            updateWatch();
            updateInformation();
        });

        // Adds event listeners to update battery state when the battery is changed.
        battery.addEventListener("chargingchange", updateBattery);
        battery.addEventListener("chargingtimechange", updateBattery);
        battery.addEventListener("dischargingtimechange", updateBattery);
        battery.addEventListener("levelchange", updateBattery);

        // Adds event listeners to change displaying child element when the battery element is clicked.
        elBattery.addEventListener("click", function() {
            toggleElement("#battery-icon", "#battery-text");
        });

        // Adds event listeners to change displaying child element when the air pollution element is clicked.
        elAir.addEventListener("click", function() {
            toggleElement("#air-icon", "#air-text");
        });
    }

    /**
     * Initiates the application.
     * Initializes watch(date and time) and informations(battery and air pollution).
     * @private
     */
    function init() {
        bindEvents();
        updateWatch();
        updateInformation();
        setInterval(function() {
            updateTime();
        }, 1000);
    }

    window.onload = init;
}());