// ==UserScript==
// @name         Export License Data
// @namespace    http://tampermonkey.net/
// @version      2025-01-25
// @description  Added as a test script to export license data and will be used as a template for helping with autofilling MVR Checker form
// @author       You
// @match        https://admin.share.car/communities/*/customers/members*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @updateURL    https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/exportLicenseData.js
// @downloadURL  https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/exportLicenseData.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to format user data into payload for MVR Checker
    function processUserInfo() {
        // Process user info into what mvr checker requires
        var user_DOB = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(2) > div.col-md-4 > div > sc-date-display > span");

        var user_name = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(1) > div:nth-child(1) > div > span");
        user_name = user_name.innerHTML.split(" ");
        const user_first_name = user_name[0];
        const user_last_name = user_name[1];

        const reference = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div.row.ng-star-inserted > div:nth-child(6) > div > span");

        const state = document.querySelector("#drivingLicenceSection > sc-driving-licence-summary > div > div:nth-child(2) > div:nth-child(6)");
        const dv_num = document.querySelector("#drivingLicenceSection > sc-driving-licence-summary > div > div:nth-child(1) > div:nth-child(2)");

        // create payload
        const payload = {
            'firstName': user_first_name,
            'lastName': user_last_name,
            'dob': user_DOB.innerHTML,
            'reference': reference.innerHTML,
            'state': state.innerHTML,
            'driverLicense': dv_num.innerHTML
        };

        console.log(payload);

        return payload;
    }

    function fillMVRChecker(user_info) {

    }

    // Function to add the recurring service booking options
    function addButton() {
        // Select the target element where buttons will be added
        var actionRow = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > header > div > div.col-md-4 > div.page-actions");

        if (actionRow && actionRow.children.length == 1) {
            // Create CSV export button
            const mvr_button = document.createElement('button');
            mvr_button.type = 'button';
            mvr_button.className = 'p-element btn btn-link';
            mvr_button.setAttribute('ptooltip', 'Transfer data to MVR Checker');
            mvr_button.innerHTML = '<i class="fa fa-download"></i> Export to MVR Checker';
            mvr_button.onclick = function(){
                const user_info = processUserInfo();
                fillMVRChecker(user_info);
            };

            // Append button to the row div after the first child
            actionRow.insertBefore(mvr_button, actionRow.children[0]);
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