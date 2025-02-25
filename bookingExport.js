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

    const url = API_ENDPOINT;
    const referer = POST_HEADERS_REFERER;

    async function lookAtMembers() {
        // Initialize response and POST API request fields
        let requestHeaders = getPostHeader();

        const request_payload = {
            scheme: 93,
            dateFrom: "2025-01-25",
            dateTo: "2025-02-25"
        };

        let requestBody = JSON.stringify(request_payload);

        // Send POST to server
        var response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: requestHeaders,
                body: requestBody
            });
        } catch (error) {
            console.error('Error making POST request:', error);
        }

        // Await the response text and log it
        const data = await response.json();
        console.log(data);

        var member_bookings = []; // Contains payload that will be used for Google Sheet or whatever we use
        const items = data._embedded.items;
        for (let i=0; i<items.length; i++) {
            // Separate member first and last name
            const member_name = items[i].memberName.split(" ");
            const member_first_name = member_name[0];
            const member_last_name = member_name[1];


            // Pickout Program Location
            var program_location;
            switch(items[i].communityId) { // TODO: Add other communities
                case 669:
                    program_location = 'Stockton';
                    break;
                case 671:
                    program_location = 'Richmond';
                    break;
                default:
                    console.log("Unknown program location");
            }


            // Calculate requested duration and actual duration
            const requested_duration = Math.abs(new Date(items[i].dropOffDatetime) - new Date(items[i].pickUpDatetime)) / (1000 * 60 * 60);
            const actual_duration = Math.abs(new Date(items[i].tripDropOffDatetime) - new Date(items[i].tripPickUpDatetime)) / (1000 * 60 * 60);


            // Format ExternalDataReference
            const start_date = new Date(items[i].pickUpDatetime);
            const end_date = new Date(items[i].dropOffDatetime);

            // Function to format time as "h:mmam/pm"
            function formatTime(date) {
                let hours = date.getHours();
                const minutes = date.getMinutes().toString().padStart(2, '0');
                const ampm = hours >= 12 ? "pm" : "am";
                hours = hours % 12 || 12; // Convert to 12-hour format
                return `${hours}:${minutes}${ampm}`;
            }

            // Function to format date as "M/D"
            function formatDate(date) {
                return `${date.getMonth() + 1}/${date.getDate()}`;
            }

            const start_month_day = formatDate(start_date);
            const end_month_day = formatDate(end_date);
            const start_time = formatTime(start_date);
            const end_time = formatTime(end_date);

            const external_data_reference = `${start_month_day}-${end_month_day} from ${start_time}-${end_time}`;

            
            let payload = {
                'member' : { /* Comments tell what the values will be used for in the google sheet report */
                    'memberEmail' : items[i].memberEmail,
                    'memberFirstName' : member_first_name,
                    'memberLastName' : member_last_name
                },
                'trip' : {
                    'externalDataReference' : external_data_reference,
                    'bookingType' : items[i].type,
                    'requestedDuration' : requested_duration,
                    'actualDuration' : actual_duration,
                    'milesDriven' :  items[i].tripDistance,
                    'vehicleUsed' :  items[i].vehiclePlate,
                    'location' :  items[i].stationName,
                    'revenue' : items[i].totalRevenue
                },
                'program' : {
                    'programLocation' : program_location,
                }
            }
            /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
             * TODO: Still need gather info on Date!, Survey Sent, Survey Completed, Applied Promo Code,     *
             * Requested Duration!, Actual Duration!, and Trip Purpose to add to payload.                    *
             *                                                                                               *
             * For DATE: not sure if that means the current date when they enter the data or something else  *
             * For ExternalDataReference: is this the booked time? (pickUpDatetime and dropOffDatetime)      *
             * For Requested Duration: is this dropOffDatetime - pickUpDatetime?                             *
             * For Actual Duration: is this tripDropOffDatetime - tripPickUpDatetime?                        *
             * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

            member_bookings.push(payload);
        }
        
        return member_bookings;
    }

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

            // Add functionality when button is clicked
            reportExportButton.addEventListener('click', async function() {
                const member_bookings = await lookAtMembers();
                console.log("Member Booking of Interest:", member_bookings[7]);
            });
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
