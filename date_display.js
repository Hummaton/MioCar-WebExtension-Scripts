// ==UserScript==
// @name         Signup Date Display
// @namespace    http://tampermonkey.net/
// @version      2024-09-30
// @description  try to take over the world!
// @author       You
// @match        https://admin.share.car/communities/694/customers/members*
// @updateURL    https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/date_display.js
// @downloadURL  https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/date_display.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @grant        none
// ==/UserScript==

(function() {
    'use strict';


    // Function to add the date selection buttons
    function addColumn() {
        // Select the target element where buttons will be added
        var table = document.querySelector('#membersTable');

        if (table) {
            // Create the table header element
            createTableHeader();
            createTableBody();
            editTableProperties();
        }

        function createTableHeader() {
            const tableHead = document.createElement('th');
            tableHead.scope = 'col';
            tableHead.width = '10%';

            // Create text node for 'Signup Date'
            const textNode = document.createTextNode('Signup Date');

            // Create the sc-collection-sort element
            const scCollectionSort = document.createElement('sc-collection-sort');
            scCollectionSort.setAttribute('column', 'signupDate');

            // Create the div for sort-options
            const sortOptionsDiv = document.createElement('div');
            sortOptionsDiv.className = 'sort-options';

            // Create span for ascending sort
            const sortAscSpan = document.createElement('span');
            sortAscSpan.className = 'sort-asc active';
            const ascIcon = document.createElement('i');
            ascIcon.className = 'fa fa-angle-up';
            ascIcon.setAttribute('aria-hidden', 'true');
            sortAscSpan.appendChild(ascIcon);

            // Create span for descending sort
            const sortDescSpan = document.createElement('span');
            sortDescSpan.className = 'sort-desc';
            const descIcon = document.createElement('i');
            descIcon.className = 'fa fa-angle-down';
            descIcon.setAttribute('aria-hidden', 'true');
            sortDescSpan.appendChild(descIcon);

            // Append the sort asc and desc to the sort-options div
            sortOptionsDiv.appendChild(sortAscSpan);
            sortOptionsDiv.appendChild(sortDescSpan);

            // Append sort-options div to sc-collection-sort
            scCollectionSort.appendChild(sortOptionsDiv);

            // Append text node and sc-collection-sort to the tableHead
            tableHead.appendChild(textNode);
            tableHead.appendChild(scCollectionSort);

            // Append tableHead to the table, e.g. to the first row of the thead
            document.querySelector('thead tr').appendChild(tableHead);
        }

        function createTableBody() {
            // Create the table data element
            const signupDate = document.createElement('td');
            signupDate.textContent = 'Sample Date';

            // Append the table data element to the table
            document.querySelector("#membersTable > tbody > tr").appendChild(signupDate);
        }

        function editTableProperties() {
            // Get the table elements
            const tableElements = document.querySelector("#membersTable > thead > tr").children;

            // Shorten the email column
            tableElements[3].width = "25%";
        }
    }

    // Create a MutationObserver to watch for changes in the DOM
    const observer = new MutationObserver((_, obs) => {
        // Check if the target (form) element is now loaded in the DOM
        if (document.querySelector('#membersTable')) {
            addColumn(); // Add the buttons
            obs.disconnect(); // Stop observing once the element is found and buttons are added
        }
    });

    // Start observing the document for changes in the DOM
    observer.observe(document, {
        childList: true,
        subtree: true
    });

})();

