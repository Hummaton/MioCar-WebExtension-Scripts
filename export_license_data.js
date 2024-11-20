// ==UserScript==
// @name         Export License Data
// @namespace    http://tampermonkey.net/
// @version      2024-10-23
// @description  try to take over the world!
// @author       You
// @match        https://admin.share.car/communities/671/customers/members/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @updateURL    https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/export_license_data.js
// @downloadURL  https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/export_license_data.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to format user data into a CSV file
    function convertToCSV() {
        // Gather user data
        var userName = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(1) > div:nth-child(1) > div > span");
        var userEmail = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(1) > div:nth-child(2) > div > span > a");
        var userPhone = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(1) > div:nth-child(3) > div > sc-telephone-link > a > span");
        var userDOB = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(2) > div.col-md-4 > div > sc-date-display > span");
        var userAddress = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(2) > div.col-md-8 > div > span > a");

        // user data access check
        alert(userName.innerHTML);
        alert(userEmail);
        alert(userPhone.innerHTML);
        alert(userDOB.innerHTML);
        alert(userAddress.innerHTML);

        // Comprise user info into a single row
        const userInfo = [userName.innerHTML, userEmail, userPhone.innerHTML, userDOB.innerHTML, userAddress.innerHTML];

        // get user address city name
        let userAddressSplit = (userAddress.innerHTML).split(',');
        console.log(userAddressSplit);
        let city_name = userAddressSplit[1];
        let isAlphabetic = /^[A-Za-z]+$/.test(city_name);
        if (!isAlphabetic) city_name = userAddressSplit[2];
        console.log(city_name);

        // geocoding api parameters
        const state_code = 'CA';
        const country_code = 'USA';
        const geocoding_apiKey = '2213ab2613bfe0a088c05f82844ca725';
        const geocoding_apiUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city_name},${state_code},${country_code}&limit=1&appid=${geocoding_apiKey}`;

        let lat = 0;
        let lon = 0;
        fetch( geocoding_apiUrl )
            .then(response => {  // Handle API network response
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => { // get lat and lon from the data
                console.log("GEOCODING DATA: ", data);
                lat = data[0].lat;
                lon = data[0].lon;
            })
            .catch(error => { // Handle any errors
                console.error('Error:', error);
            });

        // date to unix format
        let date = new Date(userDOB.innerHTML);

        // Check if the date is valid
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date format');
        }

        date = Math.floor(date.getTime() / 1000);

        // weather api parameters
        const start = date; // get from user birth date (Oct 5, 2008)
        const end = date;
        const weather_apiKey = 'c1c665b476259c5ead1d3e1a765c6951';
        const weather_apiUrl = `https://history.openweathermap.org/data/2.5/history/city?lat=${lat}&lon=${lon}&start=${start}&end=${end}&appid=${weather_apiKey}`;

        fetch( weather_apiUrl )
            .then(response => {  // Handle API network response
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => { // log the data
                console.log("WEATHER API DATA:", data);
            })

            .catch(error => { // Handle any errors
                console.error('Error:', error);
            });
                
    }

    // Function to add the recurring service booking options
    function addButton() {
        // Select the target element where buttons will be added
        var actionRow = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > header > div > div.col-md-4 > div.page-actions");

        if (actionRow && actionRow.children.length == 1) {
            // Create CSV export button
            const csvButton = document.createElement('button');
            csvButton.type = 'button';
            csvButton.id = 'csv_button';
            csvButton.className = 'p-element btn btn-link';
            csvButton.setAttribute('ptooltip', 'Download perosnal information as CSV');
            csvButton.innerHTML = '<i class="fa fa-download"></i> Export to MVR Checker';
            csvButton.onclick = function(){convertToCSV()}; 
            
            // Append button to the row div after the first child
            actionRow.insertBefore(csvButton, actionRow.children[0]);
        }
    }

    // Create a MutationObserver to watch for changes in the DOM
    const observer = new MutationObserver((mutations, obs) => {
        // Check if the target (row) element is now loaded in the DOM
        if (document.querySelector('.page-actions')) {
            setTimeout(() => {
                addButton(); // Add the CSV export button
                obs.disconnect(); // Stop observing once the element is found and button is added
            }, 200);
        }
    });

    // Start observing the document for changes in the DOM
    observer.observe(document, {
        childList: true,
        subtree: true
    });

})();



/* SELECTORS FOR DATA TO CSV

NAME:
body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(1) > div:nth-child(1) > div > span

EMAIL:
body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(1) > div:nth-child(2) > div > span > a

PHONE:
body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(1) > div:nth-child(3) > div > sc-telephone-link > a > span

DOB:
body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(2) > div.col-md-4 > div > sc-date-display > span

ADDRESS:
body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(2) > div.col-md-8 > div > span > a

RESIDENT COMMUNITY:
body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div.row.ng-star-inserted > div:nth-child(6) > div > span

*/