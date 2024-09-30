// ==UserScript==
// @name         Export Booking Data button
// @namespace    http://tampermonkey.net/
// @version      2024-09-30
// @description  try to take over the world!
// @author       You
// @match        https://admin.share.car/communities/694/bookings?type=0&status=now&pageSize=10&station=0&page=1&sortColumn=pickUpDatetime&sortDirection=asc
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to add the CSV export button
    function addCSVButton() {
        // Select the target element where the button will be added
        var rowDiv = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > div.row")

        if (rowDiv) {
            // Create container for the CSV export button
            const csvButtonDiv = document.createElement('div');
            csvButtonDiv.className = "col-md-2";

            // Create the CSV export button
            const csvButton = document.createElement('button');
            csvButton.type = 'button';
            csvButton.className = 'p-element btn btn-link';
            csvButton.setAttribute('ptooltip', 'Download the full filtered list of members as CSV');
            csvButton.innerHTML = '<i class="fa fa-download"></i> Download as CSV';

            // Append the button to the container
            csvButtonDiv.appendChild(csvButton);

            // Append the container to the row div after the first child
            rowDiv.insertBefore(csvButtonDiv, rowDiv.children[1]);
        }
    }

    // Create a MutationObserver to watch for changes in the DOM
    const observer = new MutationObserver((mutations, obs) => {
        // Check if the target (row) element is now loaded in the DOM
        if (document.querySelector('.row')) {
            addCSVButton(); // Add the CSV export button
            obs.disconnect(); // Stop observing once the element is found and button is added
        }
    });

    // Start observing the document for changes in the DOM
    observer.observe(document, {
        childList: true,
        subtree: true
    });

})();
