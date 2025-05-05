// ==UserScript==
// @name         Signup Date Display
// @namespace    http://tampermonkey.net/
// @version      2025-05-04
// @match        https://admin.share.car/communities/*/customers/members*
// @updateURL    https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/src/signupDateDisplay.user.js
// @downloadURL  https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/src/signupDateDisplay.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /************* FILL IN FOR PRODUCTION SCRIPT  */
    const TARGET_URL = ""; // Target API endpoint
    const LOGGING_API_URL = ""; // Logging API endpoint
    /************* FILL IN FOR PRODUCTION SCRIPT  */

    // Empty array to store API response data
    var data_response_arr = [];

    // Observer to detect when the page has loaded and to add the button
    const observer = new MutationObserver((_, obs) => {
        if (document.querySelector('#membersTable') &&
            !document.querySelector("#membersTable > tbody > tr:nth-child(1) > td:nth-child(7)")) {
            addColumn(data_response_arr);
        }
    });

    // Function to add the date selection buttons
    function addColumn(data) {
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
            sortAscSpan.className = 'sort-asc';
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

            // Ascending sort OnClick event listener (up arrow)
            sortAscSpan.addEventListener("click", function () {
                // create new member list with newest to oldest start dates if not already selected
                if (!sortAscSpan.classList.contains("active")) {
                    sortAscSpan.classList.add("active");
                    sortDescSpan.classList.remove("active");

                    let currentURL = window.location.href;
                    let result = currentURL.toLowerCase().includes("sortDirection=desc".toLowerCase());
                    if (!result) {
                        currentURL = currentURL.slice(0, -3) + "desc";
                        window.location.href = currentURL;
                    }
                }
            });

            // Descending sort OnClick event listener (down arrow)
            sortDescSpan.addEventListener("click", function () {
                // create new member list with oldest to newest start dates if not already selected
                if (!sortDescSpan.classList.contains("active")) {
                    sortDescSpan.classList.add("active");
                    sortAscSpan.classList.remove("active");

                    let currentURL = window.location.href;
                    let result = currentURL.toLowerCase().includes("sortDirection=asc".toLowerCase());
                    if (!result) {
                        currentURL = currentURL.slice(0, -4) + "asc";
                        window.location.href = currentURL;
                    }
                }
            });

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


        function createTableBody(date_str, iter) { // date : String
            // Create the table data element
            const signupDate = document.createElement('td');
            signupDate.textContent = date_str;

            // Append the table data element to the table
            document.querySelector("#membersTable > tbody > tr:nth-child(" + iter + ")").appendChild(signupDate);
        }

        function createdAtDateToStdDate(created_at_date) {
            const day = String(created_at_date.getDate()).padStart(2,"0");
            const month = String(created_at_date.getMonth() + 1).padStart(2,"0");
            const year = created_at_date.getFullYear();

            return `${month}/${day}/${year}`;
        }

        function editTableProperties() {
            // Get the table elements
            const tableElements = document.querySelector("#membersTable > thead > tr").children;

            // Shorten the email column
            tableElements[3].width = "25%";
        }



        // Select the target element where buttons will be added
        var table = document.querySelector('#membersTable');

        if (table) {
            // Create the table header element
            if (!document.querySelector("#membersTable > thead > tr > th:nth-child(7)")) {
                createTableHeader();
            }

            // darken arrow based on chosen sort
            let currentURL = window.location.href;
            let result = currentURL.toLowerCase().includes("sortDirection=desc".toLowerCase());
            const sortAsc = document.querySelector("#membersTable > thead > tr > th:nth-child(7) > sc-collection-sort > div > span.sort-asc");
            const sortDesc = document.querySelector("#membersTable > thead > tr > th:nth-child(7) > sc-collection-sort > div > span.sort-desc");
            if (result) {
                sortAsc.classList.add("active");
                sortDesc.classList.remove("active");
            } else {
                sortDesc.classList.add("active");
                sortAsc.classList.remove("active");
            }

            // add dates
            for (let i=0; i<data._embedded.members.length;i++) {
                let std_date = createdAtDateToStdDate(new Date(data._embedded.members[i].createdAt));

                createTableBody(std_date, (i+1));
            }

            editTableProperties();
        }

    }

    /*************         Main Function     *************/

    // Start observing the document for changes in the DOM
    observer.observe(document, {
        childList: true,
        subtree: true
    });

    // Intercept API call to get Member data
    const open = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method, url_arg, ...rest) {
        if (url_arg.startsWith(TARGET_URL)) {
            this.addEventListener("load", function() {
                try {
                    data_response_arr = JSON.parse(this.responseText);
                } catch (error) {
                    console.error("Error parsing response data: ", error);
                    logMetricToAWS({
                        LOGGING_API_URL,
                        level: "ERROR",
                        message: `Error parsing response data for Date Display: ${error.message}`,
                    });
                }
            });
        }
        return open.apply(this, [method, url_arg, ...rest]);
    };



})();
