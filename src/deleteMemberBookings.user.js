// ==UserScript==
// @name         Delete Member Bookings
// @namespace    http://tampermonkey.net/
// @version      2025-05-04
// @match        https://admin.share.car/communities/*/fleet/vehicles/*
// @updateURL    https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/src/deleteMemberBookings.user.js
// @downloadURL  https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/src/deleteMemberBookings.user.js
// @require      https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/main/utilities.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /************* FILL IN FOR PRODUCTION SCRIPT  */
    var TARGET_URL = ""; // Target API endpoint
    const LOGGING_API_URL = ""; // Logging API endpoint
    /************* FILL IN FOR PRODUCTION SCRIPT  */


    /********** Progress Bar **********/
    function createProgressBar() {

        const check_availability_parent_div = document.querySelector("body > delete-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-footer");
        const progress_bar_container = document.createElement('div');
        progress_bar_container.className = 'progress-bar-container-booking-form';
        progress_bar_container.style.width = '100%';
        progress_bar_container.style.backgroundColor = '#f3f3f3';
        progress_bar_container.style.borderRadius = '5px';
        progress_bar_container.style.marginTop = '10px';

        const progress_bar = document.createElement('div');
        progress_bar.className = 'progress-bar-booking-form';
        progress_bar.style.width = '0%';
        progress_bar.style.height = '20px';
        progress_bar.style.backgroundColor = '#4caf50';
        progress_bar.style.borderRadius = '5px';

        progress_bar_container.appendChild(progress_bar);
        check_availability_parent_div.appendChild(progress_bar_container);
    }

    function incrementProgressBar(completed_intervals, total_intervals) {
        const progress_bar = document.querySelector('.progress-bar-booking-form');
        const progress_percentage = (completed_intervals / total_intervals) * 100;
        progress_bar.style.width = `${progress_percentage}%`;
    }

    function removeProgressBar() {
        const progress_bar_container = document.querySelector('.progress-bar-container-booking-form');

        if (progress_bar_container) {
            progress_bar_container.remove();
        }
    }

    /*********** Select Functionality **********/

    function toggle_all_select(source) {
        const allCheckboxes = document.querySelectorAll('.booking-select');
        allCheckboxes.forEach(cb => cb.checked = source.checked);
    }

    // Add select column and button when page loads
    function add_select_column() {
        const booking_table_header = document.querySelector("#BookingTable > thead > tr");
        const booking_table_body = document.querySelector("#BookingTable > tbody");

        // Create select all button
        const th_head = document.createElement("th");
        th_head.scope = "col";
        th_head.width = "9%";

        const input_head = document.createElement("input");
        input_head.type = "checkbox";
        input_head.id = "booking-select-all";
        input_head.addEventListener('click', function() {
            toggle_all_select(this);
        });

        th_head.appendChild(input_head);
        booking_table_header.insertBefore(th_head, booking_table_header.firstChild);

        // Create individual booking select buttons
        booking_table_body.querySelectorAll("tr").forEach(tr => {
            const td_body = document.createElement("td");
            const input_body = document.createElement("input");
            input_body.type = "checkbox";
            input_body.classList.add("booking-select");

            input_body.addEventListener('click', function() {
                if (input_head.checked) input_head.checked = false;

                // check if all rows are checked to update head checkbox
                let all_checked = true;
                const rows = booking_table_body.querySelectorAll("tr");
                for (const tr of rows) {
                    const checkbox = tr.querySelector("input[type='checkbox']");

                    if (checkbox && !checkbox.checked) {
                        all_checked = false;
                        break;
                    }
                }

                if (all_checked == true) input_head.checked = true;
            });

            td_body.appendChild(input_body);
            tr.insertBefore(td_body, tr.firstChild);
        });

    }

    /****** DELETE FUNCTIONALITY ******/

    async function delete_bookings(bookings) {
        // API endpoint to concatenate: */actions/cancel
        const delete_button = document.querySelector('#confirm-delete-btn');
        if (delete_button) {
            delete_button.remove();
        }

        let bad_booking_ids = [];
        createProgressBar();
        const start = performance.now();
        for (let i=0; i < bookings.length; i++) {
            let booking_id = bookings[i][1];
            let endpoint_ending = booking_id + "/actions/cancel";

            // update target URL
            let temp_target_url = TARGET_URL + endpoint_ending;

            var response;
            let requestHeaders = getPostHeader(LOGGING_API_URL);
            // Send POST to delete bookings
            try {
                response = await fetch(temp_target_url, {
                    method: 'POST',
                    headers: requestHeaders
                });

                //Log the booking using AWS Cloudwatch (future development)
            } catch (error) {
                console.error('Error: Bad Booking Delete POST request:', error);
                logMetricToAWS(cloudwatch_url, 'Error: Booking Delete API call: ' + error);
            }

            if (response.status !== 200) {
                console.error('Error: Bad Booking Delete POST request:', response.status);
                bad_booking_ids.push(booking_id);
            }
    
            incrementProgressBar(i+1, bookings.length);
        }
        const end = performance.now();
        let time_to_delete = (end-start) / 1000; // in seconds
        removeProgressBar();

        // Change Booking Message
        const modal_center_text = document.querySelector("body > delete-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-body > div > div > p");        
        modal_center_text.innerText = `${bookings.length} booking(s) were deleted!`;


        if (bad_booking_ids.length > 0) {
            console.log("Bad Booking IDs:", bad_booking_ids);
            const bad_booking_ids_div = document.createElement("p");
            bad_booking_ids_div.style.textAlign = 'center';
            bad_booking_ids_div.style.fontSize = '1em';
            bad_booking_ids_div.innerText = `\nThe following booking IDs could not be deleted:\n\n ${bad_booking_ids.join(", ")}`;
            modal_center_text.appendChild(bad_booking_ids_div);
        }

        // Refresh the page only if all bookings were deleted successfully
        if (bad_booking_ids.length === 0) {
            // Remove modal after 3 seconds
            setTimeout(() => {
                document.querySelector("body > delete-booking-modal").remove();
                // Refresh page
                window.location.reload();
            }, 2000); // 2000 milliseconds = 2 seconds
        }

    }

    function open_delete_window() {
        // Get data and count number of bookings
        var selectedBookingsCount = 0;
        const bookings_to_delete = [];
        const booking_table_body = document.querySelector("#BookingTable > tbody");
        const rows = booking_table_body.querySelectorAll("tr");

        rows.forEach(tr => {
            const checkbox = tr.querySelector("input[type='checkbox']");

            if (checkbox && checkbox.checked) {
                selectedBookingsCount++;
                const rowData = [];
                tr.querySelectorAll("td").forEach(td => {
                    // Get data from each column
                    rowData.push(td.innerText);
                });
                bookings_to_delete.push(rowData);
            }
        });

        // Create delete pop up modal
        const delete_modal = document.createElement('delete-booking-modal');
        // copied form HTML from service booking form
        delete_modal.innerHTML = `
          <div role="dialog" index="0" animate="animate" class="modal note-modal fade in" style="display: block;">
            <div class="modal-dialog">
            <div class="modal-content">
                <form name="deleteBookings" class="delete-booking-form">
                <div class="modal-header">
                    <h3 class="modal-title">Delete Selected Bookings</h3>
                    <a class="close-button" id="close-modal-btn"><i aria-hidden="true" class="fa fa-times"></i></a>
                </div>
                <div class="modal-body" style="overflow: visible;">
                    <div class="row"><div class="col-md-12">
                        <p style="text-align: center; font-size: 1.5em;">Do you want to delete the following bookings?</p>
                    </div></div>
                </div>
                <div class="modal-footer">
                    <button type="button" id="confirm-delete-btn" class="btn btn-danger ng-star-inserted"> Delete </button>
                </div>
                </form>
            </div>
            </div>
        </div>
        <div class="modal-backdrop fade in" id="modal-backdrop" style="z-index: 1040;" aria-hidden="true"></div>
        `;
        document.body.appendChild(delete_modal);

        // Add booking information
        const delete_bookings_div = document.querySelector("body > delete-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-body > div > div");
        for (let i=0; i<bookings_to_delete.length; i++) {
            const delete_booking_info = document.createElement("p");
            delete_booking_info.style.textAlign = 'center';
            delete_booking_info.style.fontSize = '1.3em';

            let booking_type = bookings_to_delete[i][2];
            let date_time = bookings_to_delete[i][3];

            delete_booking_info.innerText = `${booking_type} booking on ${date_time}`;

            delete_bookings_div.appendChild(delete_booking_info);
        }

        // Close modal via close button
        delete_modal.querySelector('#close-modal-btn').addEventListener('click', () => {
            delete_modal.remove();
        });

        // Close modal when clicking on the backdrop
        delete_modal.querySelector('#modal-backdrop').addEventListener('click', () => {
            delete_modal.remove();
        });

        // Confirm delete
        delete_modal.querySelector('#confirm-delete-btn').addEventListener('click', () => {
            // code for deleting bookings
            delete_bookings(bookings_to_delete);
        });
    }

    function add_delete_button() {
        const booking_page_header = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > div > section:nth-child(7) > section > sc-booking-filters > form");

        const delete_button_div = document.createElement("div");
        delete_button_div.classList.add("form-group", "ng-star-inserted");
        delete_button_div.style.paddingTop = '35px';


        // Create booking delete button
        const booking_delete_button = document.createElement("button");
        booking_delete_button.textContent = "Delete Selected Bookings";
        booking_delete_button.id = "booking-delete-button";
        booking_delete_button.classList.add("btn", "btn-danger", "ng-star-inserted");

        booking_delete_button.addEventListener('click', function() {
            open_delete_window();
        });

        delete_button_div.appendChild(booking_delete_button);

        booking_page_header.insertBefore(delete_button_div, booking_page_header.lastElementChild);
    }


    /*************         Main Function     *************/

    // Observer to detect when the page has loaded and to add the button
    const observer = new MutationObserver((_, obs) => {
        if (document.querySelector('#BookingTable') &&
            !document.querySelector("#BookingTable > thead > tr > th:nth-child(1) > input[type=checkbox]")) {
            add_select_column();
            add_delete_button();
        }
    });

    // Start observing the document for changes in the DOM
    observer.observe(document, {
        childList: true,
        subtree: true
    });

})();

