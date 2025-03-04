// ==UserScript==
// @name         Booking Report Export
// @namespace    http://tampermonkey.net/
// @version      2025-01-25
// @description  Adds a button to export booking reports as CSV
// @match        https://admin.share.car/reports
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @grant        none
// @require      https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/report_dev/utilities.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /************* FILL IN FOR PRODUCTION SCRIPT  */
    const TARGET_URL = ""; // Target API endpoint
    const LOGGING_API_URL = ""; // Logging API endpoint
    /************* FILL IN FOR PRODUCTION SCRIPT  */

    // Utility functions
    function formatTime(date) {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? "pm" : "am";
        hours = hours % 12 || 12; // Convert to 12-hour format
        return `${hours}:${minutes}${ampm}`;
    }

    function formatDate(date) {
        return `${date.getMonth() + 1}/${date.getDate()}`;
    }

    async function generateExcelSheet(data) {
        const date_from = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > div > section > header > div > div.col-md-8 > p > strong:nth-child(2) > sc-date-display:nth-child(1) > span").innerHTML;
        const date_to = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > div > section > header > div > div.col-md-8 > p > strong:nth-child(2) > sc-date-display:nth-child(2) > span").innerHTML;

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, `${date_from} to ${date_to}`);

        const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "exported_data.xlsx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    }

    async function processMemberData(data_arr) {
        const member_bookings = [["Date", "Email", "First Name", "Last Name", "Program Location", "ExternalDataReference", "Survey Sent", "Follow Up Email", "Survey Complete", "Applied Promo Code", "Requested Duration", "Actual Duration", "Miles Driven", "Vehicle Used", "Location", "Revenue", "Trip Purpose", "Notes"]];
        const items = data_arr._embedded.items;

        for (let i = 0; i < items.length; i++) {
            if (items[i].status === 'Cancelled') continue;

            const member_name = items[i].memberName.split(" ");
            const member_first_name = member_name[0];
            const member_last_name = member_name[1];

            let program_location;
            switch (items[i].communityId) {
                case 669:
                    program_location = 'Stockton';
                    break;
                case 671:
                    program_location = 'Richmond';
                    break;
                default:
                    console.log("Unknown program location");
            }

            const requested_duration = Math.abs(new Date(items[i].dropOffDatetime) - new Date(items[i].pickUpDatetime)) / (1000 * 60 * 60);
            const actual_duration = Math.ceil(Math.abs(new Date(items[i].tripDropOffDatetime) - new Date(items[i].tripPickUpDatetime)) / (1000 * 60 * 60) * 4) / 4;

            const start_date = new Date(items[i].pickUpDatetime);
            const end_date = new Date(items[i].dropOffDatetime);
            const external_data_reference = `${formatDate(start_date)}-${formatDate(end_date)} from ${formatTime(start_date)}-${formatTime(end_date)}`;

            const today = new Date();
            const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

            const payload = [lastDayOfMonth, items[i].memberEmail, member_first_name, member_last_name, program_location, external_data_reference, "", "", "", "", requested_duration.toFixed(2), actual_duration.toFixed(2), items[i].tripDistance, items[i].vehiclePlate, items[i].stationName, items[i].totalRevenue, "", ""];
            member_bookings.push(payload);
        }

        return member_bookings;
    }

    function addButton() {
        const rowDiv = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > div > section > header > div > div.col-md-4.icon-links");

        if (rowDiv) {
            const reportExportButton = document.createElement('button');
            reportExportButton.type = 'button';
            reportExportButton.className = 'p-element btn btn-link';
            reportExportButton.id = 'report-export-button';
            reportExportButton.setAttribute('ptooltip', 'Generate a formatted CSV report of the data');

            const icon = document.createElement('i');
            icon.className = 'fa fa-download';
            reportExportButton.appendChild(icon);
            reportExportButton.appendChild(document.createTextNode(' Generate Report'));

            rowDiv.insertBefore(reportExportButton, rowDiv.children[1]);

            reportExportButton.addEventListener('click', async function() {
                try {
                    const start = performance.now();
                    const member_bookings = await processMemberData(data_response_arr);
                    await generateExcelSheet(member_bookings);
                    const end = performance.now();
                    console.log(`Report Export took ${(end - start) / 1000} seconds`);
                    console.log("Member Bookings processed: ", data_response_arr._embedded.items.length);
                    const time_saved = 160 * member_bookings.length;
                    console.log("Time saved: ", time_saved);
                    logSuccessToAWS(LOGGING_API_URL, "Report Exported", time_saved, "Intercepted report payload. No request made", "Intercepted report payload. No response received");
                } catch (error) {
                    console.error("Error generating report: ", error);
                    logErrorToAWS(LOGGING_API_URL, `Error generating report:" ${error.message}`, "Intercepted report payload. No request made", "Intercepted report payload. No response received");
                }
            });
        }
    }

    /*************         Main Function     *************/

    // Observer to detect when the page has loaded and to add the button
    const observer = new MutationObserver((_, obs) => {
        if (document.querySelector('.col-md-4.icon-links')) {
            addButton();
            obs.disconnect();
        }
    });

    observer.observe(document, {
        childList: true,
        subtree: true
    });

    // Empty array to store API response data
    let data_response_arr = [];

    // Intercept API call to get booking data
    const open = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method, url_arg, ...rest) {
        if (!document.querySelector("#report-export-button")) {
            observer.observe(document, {
                childList: true,
                subtree: true
            });
        }

        if (url_arg.includes(TARGET_URL)) {
            this.addEventListener("load", function() {
                try {
                    data_response_arr = JSON.parse(this.responseText);
                } catch (error) {
                    console.error("Error parsing response data: ", error);
                    logErrorToAWS(LOGGING_API_URL, "Error parsing response data", error.message);
                }
            });
        }
        return open.apply(this, [method, url_arg, ...rest]);
    };

    
})();
