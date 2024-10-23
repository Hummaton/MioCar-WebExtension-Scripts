// ==UserScript==
// @name         Export License Data
// @namespace    http://tampermonkey.net/
// @version      2024-10-23
// @description  try to take over the world!
// @author       You
// @match        https://admin.share.car/communities/671/customers/members/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // Function to add the recurring service booking options
    function addButton() {
        // Select the target element where buttons will be added
        var actionRow = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(2) > header > div > div:nth-child(2) > div.page-actions");

        if (actionRow) {
            // Create CSV export button
            const csvButton = document.createElement('button');
            csvButton.type = 'button';
            csvButton.className = 'p-element btn btn-link btn-blue';
            csvButton.setAttribute('ptooltip', 'Download perosnal information as CSV');
            csvButton.innerHTML = '<i class="fa fa-download"></i> Download as CSV';

            // Append button to the row div after the first child
            actionRow.insertBefore(csvButton, actionRow.children[1]);
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