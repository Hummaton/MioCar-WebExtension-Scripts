// ==UserScript==
// @name         Get Booking Inputs
// @namespace    http://tampermonkey.net/
// @version      2025-01-21
// @description  try to take over the world!
// @author       You
// @match        *://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /* 'date' is the js Date object */
    function convert_datetime_to_string(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        const formattedDate = '${year}-${month}-${day} ${hours}:${minutes}:${seconds}';
        return formattedDate;
    }

    function validateInputs() {
        // Ensure all input fields are filled
        var purpose_element = document.getElementById("inputPurpose");
        var repeat_interval_element = document.getElementById("repeatInterval");
        var input_end_date_element = document.getElementById("input-end-date");
        if (purpose_element.value == 'undefined') {
            alert("Select a Booking Purpose");
            return null;
        }

        var new_check_avail_element = document.querySelector("#new-check-availability-button");
        if (new_check_avail_element) {
            if (repeat_interval_element.value == 'undefined') {
                alert("Select a Repeat Interval");
                return null;
            }

            if (input_end_date_element.value == '') {
                alert("Select Repeat End Date");
                return null;
            }
        }


        // Validate date inputs
        var pick_up_time_element = document.getElementById('input-pickup-time');
        var drop_off_time_element = document.getElementById("input-dropoff-time");

        var pickup_datetime_obj = new Date(pick_up_time_element.value);
        var dropoff_datetime_obj = new Date(drop_off_time_element.value);
        var input_end_datetime_obj = new Date(input_end_date_element.value + 'T23:59:00');

        if (input_end_datetime_obj < dropoff_datetime_obj || dropoff_datetime_obj < pickup_datetime_obj) {
            alert('Invalid Date Input');
            return null;
        }

        // Create payload
        const pickup_datetime_string = convert_datetime_to_string(pickup_datetime_obj);
        const dropoff_datetime_string = convert_datetime_to_string(drop_off_time_element);
        const type = "service"; // TODO: check if this changes
        const purpose = purpose_element.value;
        const dry_run = true; // TODO: confirm this does not change

        // Get vehicle ID
        const vehicle_id_element = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > div > section:nth-child(1) > form > header > div > div.col-md-7 > div > div.title-data-item.strong.ng-star-inserted");
        const vehicle_id = parseInt(vehicle_id_element.innerHTML);

        // Get community ID
        const community_id = ; 

        const payload = {
            'pickUpDatetime': pickup_datetime_string,
            'dropOffDatetime': dropoff_datetime_string,
            'type': type,
            'vehicle': vehicle_id,
            'purpose': purpose,
            'dry-run': dry_run,
            'community': community_id
        }
        alert(payload);
        return payload;

    }

    function check_availability() {

    }


    const intervalId = setInterval(() => {
        // Check if the "Check Availability" button is now in the DOM
        var check_avail_button = document.querySelector("body > sc-app-root > sc-service-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-footer > button.btn.btn-blue");

        if (check_avail_button) {
            // Add the click event listener to the button
            console.log("EVENT LISTENER ADDED");
            check_avail_button.addEventListener("click", function () {
                validateInputs();
                check_availability();
            });

            // Stop checking once the button is found and event listener is attached
            clearInterval(intervalId);
        }
        console.log("BUTTON NOT FOUND");
    }, 100); // Check every 100ms
})();

