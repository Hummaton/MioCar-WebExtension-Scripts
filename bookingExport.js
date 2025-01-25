// ==UserScript==
// @name         Booking Report Export 
// @namespace    http://tampermonkey.net/
// @version      2025-01-25
// @description  Adds a button to export booking reports as CSV
// @match        https://admin.share.car/reports
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/bookingExport.js
// @downloadURL  https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/bookingExport.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to add the CSV export button
    function addButton() {
        // Select the target element where the button will be added
        var rowDiv = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > div > section > header > div > div.col-md-4.icon-links")

        if (rowDiv) {
            // Create the CSV export button
            const reportExportButton = document.createElement('button');
            reportExportButton.type = 'button';
            reportExportButton.className = 'p-element btn btn-link';
            reportExportButton.setAttribute('ptooltip', 'Generate a formatted CSV report of the data');

            // Create the icon element
            const icon = document.createElement('i');
            icon.className = 'fa fa-download';

            // Append the icon to the button
            reportExportButton.appendChild(icon);

            // Add button text
            reportExportButton.appendChild(document.createTextNode(' Generate Report'));

            // Append the button to the row div after the first child
            rowDiv.insertBefore(reportExportButton, rowDiv.children[1]);
        }
    }

    // Create a MutationObserver to watch for changes in the DOM
    const observer = new MutationObserver((_, obs) => {
        // Check if the target (row) element is now loaded in the DOM
        if (document.querySelector('.col-md-4.icon-links')) {
            addButton(); // Add the CSV export button
            obs.disconnect(); // Stop observing once the element is found and button is added
        }
    });

    // Start observing the document for changes in the DOM
    observer.observe(document, {
        childList: true,
        subtree: true
    });

})();
