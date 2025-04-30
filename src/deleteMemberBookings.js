// ==UserScript==
// @name         Delete Member Bookings
// @namespace    http://tampermonkey.net/
// @version      2025-04-30
// @description  Display a signup date column in the members bookings table for deleting and a delete button
// @author       You
// @match        https://admin.share.car/communities/*/customers/members/*
// @updateURL    https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/deleteMemberBookings.js
// @downloadURL  https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/deleteMemberBookings.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /************* FILL IN FOR PRODUCTION SCRIPT  */
    const TARGET_URL = ""; // Target API endpoint
    const LOGGING_API_URL = ""; // Logging API endpoint
    /************* FILL IN FOR PRODUCTION SCRIPT  */

    // Observer to detect when the page has loaded and to add the button
    const observer = new MutationObserver((_, obs) => {
        if (document.querySelector('#BookingTable') &&
            !document.querySelector("#BookingTable > thead > tr > th:nth-child(1) > input[type=checkbox]")) {
            console.log("HERE");
            add_select_column();
            add_delete_button();
        }
    });

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
            console.log("TOGGLING SELECT");
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
            });

            td_body.appendChild(input_body);
            tr.insertBefore(td_body, tr.firstChild);
        });

    }

    function open_delete_window() {
        // Get data and count number of bookings
        var selectedBookingsCount = 0;
        const checkedRows = [];
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
                checkedRows.push(rowData);
            }
        });
        console.log(checkedRows);

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
                   <p style="text-align: center; font-size: 1.5em;">Do you want to delete ${selectedBookingsCount} bookings?</p>
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
            console.log("DELETING SELECTED BOOKINGS");
            // code for deleting bookings
        });
    }

    function add_delete_button() {
        const booking_page_actions = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(5) > header > div > div.col-md-8 > div");

        // Create booking delete button
        const booking_delete_button = document.createElement("button");
        booking_delete_button.textContent = "Delete Selected Bookings";
        booking_delete_button.classList.add("btn", "btn-danger", "ng-star-inserted");
        booking_delete_button.addEventListener('click', function() {
            console.log("OPENING DELETE POPUP");
            open_delete_window();
        });

        booking_page_actions.appendChild(booking_delete_button);
    }


    /*************         Main Function     *************/

    // Start observing the document for changes in the DOM
    observer.observe(document, {
        childList: true,
        subtree: true
    });

})();
