// ==UserScript==
// @name         Booking Report Export
// @namespace    http://tampermonkey.net/
// @version      2025-01-25
// @description  Adds a button to export booking reports as CSV
// @match        https://admin.share.car/reports
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @grant        none
// @require      https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/main/utilities.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /************* FILL IN FOR PRODUCTION SCRIPT  */
    const TARGET_URL = ""; // Target API endpoint
    /************* FILL IN FOR PRODUCTION SCRIPT  */

    async function generateExcelSheet(data) {
        let date_from_element = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > div > section > header > div > div.col-md-8 > p > strong:nth-child(2) > sc-date-display:nth-child(1) > span");
        const date_from = date_from_element.innerHTML;

        let date_to_element = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > div > section > header > div > div.col-md-8 > p > strong:nth-child(2) > sc-date-display:nth-child(2) > span");
        const date_to = date_to_element.innerHTML;

        console.log("DATA: ", date_from, date_to);

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, date_from + " to " + date_to);

        // Convert workbook to binary data
        const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

        // Create a Blob and download the file
        const blob = new Blob([wbout], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);

        // Create a temporary download link
        const a = document.createElement("a");
        a.href = url;
        a.download = "exported_data.xlsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Clean up object URL
        URL.revokeObjectURL(url);

        console.log("GENERATED XLSX SHEET");

    }

    async function processMemberData(data_arr) {

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

        console.log(data_arr);

        // Contains header for excel sheet
        var member_bookings = [["Date", "Email", "First Name", "Last Name", "Program Location",
            "ExternalDataReference", "Survey Sent", "Follow Up Email", "Survey Complete", "Applied Promo Code",
            "Requested Duration", "Actual Duration", "Miles Driven", "Vehicle Used", "Location", "Revenue",
            "Trip Purpose", "Notes"]];
        const items = data_arr._embedded.items;

        for (let i=0; i<items.length; i++) {

            if (items[i].tripDistance === null) {
                continue;
            }

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

            const start_month_day = formatDate(start_date);
            const end_month_day = formatDate(end_date);
            const start_time = formatTime(start_date);
            const end_time = formatTime(end_date);

            const external_data_reference = `${start_month_day}-${end_month_day} from ${start_time}-${end_time}`;

            // get current date
            var today = new Date();
            var lastDayOfMonth = new Date(today.getFullYear(), today.getMonth()+1, 0);


            let payload = [lastDayOfMonth, items[i].memberEmail, member_first_name, member_last_name, program_location,
                external_data_reference, "", "", "", "", requested_duration.toFixed(2), actual_duration.toFixed(2),
                items[i].tripDistance, items[i].vehiclePlate, items[i].stationName, items[i].totalRevenue, "", ""
            ];

            member_bookings.push(payload);
        }

        return member_bookings;
    }

    var data_response_arr;

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
                const start = performance.now();
                const member_bookings = await processMemberData(data_response_arr);
                console.log("Member Booking of Interest:", member_bookings[7]);
                await generateExcelSheet(member_bookings);
                const end = performance.now();
                console.log(`Report Export took ${(end - start) / 1000} seconds`);
                console.log("Member Bookings processed: ", member_bookings.length);
                let time_saved = 160 * member_bookings.length;   //Each booking takes 160 seconds roughly to process manually
                console.log("Time saved: ", time_saved);
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

    // Intercept member data through Hook XMLHttpRequest
    const open = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method, url_arg, ...rest) {
        if (!document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > div > section > header > div > div.col-md-4.icon-links > button:nth-child(2)")) {
            observer.observe(document, {
                childList: true,
                subtree: true
            });
        }

        if (url_arg.includes(TARGET_URL)) {
            this.addEventListener("load", function() {
                console.log("[Tampermonkey] Intercepted XHR request:", {
                    method: method,
                    url: url_arg,
                    status: this.status,
                    response: JSON.parse(this.responseText)
                });

                data_response_arr = (JSON.parse(this.responseText));
                console.log("DATA RESPONSE ARRAY: ", data_response_arr);
            });
        }
        return open.apply(this, [method, url_arg, ...rest]);
    };

    console.log("🚨 Fetch Interceptor is Running...");


})();