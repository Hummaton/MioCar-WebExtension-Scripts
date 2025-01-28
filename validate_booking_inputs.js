// ==UserScript==
// @name         Get Booking Inputs
// @namespace    http://tampermonkey.net/
// @version      2025-01-21
// @description  try to take over the world!
// @author       You
// @match        https://admin.share.car/communities/*/fleet/vehicles/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @require      https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/main/utilities.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /* HTTP Responses */
    const CREATED = 201; // The HTTP 201 Created successful response status code indicates that the HTTP request has led to the creation of a resource.
    const UNPROCESSABLE_CONTENT = 422; // The HTTP 422 Unprocessable Content client error response status code indicates that the server understood the content type of the request content, and the syntax of the request content was correct, but it was unable to process the contained instructions.

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

    function repeat_interval_to_int(repeat_interval) {
        // ['Daily', 'Weekly', 'Bi-Weekly', 'Monthly', 'Yearly']
        var repeat_interval_int = 0;
        switch(repeat_interval) {
            case 'Daily':
                repeat_interval_int = 1;
                break;
            case 'Weekly':
                repeat_interval_int = 7;
                break;
            case 'Bi-Weekly':
                repeat_interval_int = 14;
                break;
            case 'Monthly':
                repeat_interval_int = 30;
                break;
            case 'Yearly':
                repeat_interval_int = 365;
                break;
            default:
                alert('Invalid repeat interval type');
                console.log('Invalid repeat interval type');
        }

        return repeat_interval;
    }

    function validate_inputs() {
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
        const repeat_interval = repeat_interval_to_int(repeat_interval_element.value);
        const end_datetime_string = convert_datetime_to_string(input_end_datetime_obj);

        // Get vehicle ID
        const vehicle_id_element = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > div > section:nth-child(1) > form > header > div > div.col-md-7 > div > div.title-data-item.strong.ng-star-inserted");
        const vehicle_id = parseInt(vehicle_id_element.innerHTML);

        // Get community ID
        const community_id = getBrowserStorageValue('activeCommunityId');

        const payload = {
            'pickUpDatetime': pickup_datetime_string,
            'dropOffDatetime': dropoff_datetime_string,
            'type': type,
            'vehicle': vehicle_id,
            'purpose': purpose,
            'dry-run': dry_run,
            'community': community_id,
            'repeat-interval': repeat_interval,
            'endDatetime': end_datetime_string
        }
        alert(payload);
        return payload;

    }

    async function check_availability(payload) {
        const pickup_datetime_obj = new Date(payload.pickUpDatetime);
        const dropoff_datetime_obj = new Date(payload.dropoff_datetime_string);
        const repeat_end_datetime_obj = new Date(payload.endDatetime);
        const repeat_interval_int = payload.repeat_interval;

        // POST arguments
        const url = ; // TODO: api endpoint? 
        const apiKey = getBrowserStorageValue('oauth')?.access_token;
        const headers = {
        };

        var bad_dates = [];
        var curr_pickup_datetime_obj = pickup_datetime_obj;
        var curr_dropoff_datetime_obj = dropoff_datetime_obj;
        while (curr_pickup_datetime_obj <= repeat_end_datetime_obj) {
            const response_payload = {
                'pickUpDatetime': convert_datetime_to_string(curr_pickup_datetime_obj),
                'dropOffDatetime': convert_datetime_to_string(curr_dropoff_datetime_obj),
                'type': payload.type,
                'vehicle': payload.vehicle_id,
                'purpose': payload.purpose,
                'dry-run': payload.dry_run,
                'community': payload.community_id,
            };

            // Send POST to server
            try {
                console.log('Attempting to send POST request...');
                const response = await fetch(url, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(response_payload)
                });
                console.log('Status Code:', response.status);
            } catch (error) {
                console.error('Error making POST request:', error);
            }
            
            // Handle POST responses
            if (!(response.status == CREATED)) {
                // TODO: Check for 4** errors and handle below
                // Add unknown errors to google sheets
            }
            
            if (response.status == UNPROCESSABLE_CONTENT) {
                bad_dates.append(convert_datetime_to_string(curr_pickup_datetime_obj));
            }

            // Increment pickup and dropoff datetimes by the repeat interval
            curr_pickup_datetime_obj.setDate(curr_pickup_datetime_obj.getDate() + repeat_interval_int);
            curr_dropoff_datetime_obj.setDate(curr_dropoff_datetime_obj.getDate() + repeat_interval_int);
            await delay(10); // Pause for 10ms
        }

        if (bad_dates.length == 0) {
            alert("All dates available"); // TODO: Display nice response to user
        } else {
            var output = "Bad Dates: ";
            for (let i=0; i < bad_dates.length; i++) {
                output = output + convert_datetime_to_string(bad_dates[i]);
            }
            alert(output); // TODO: Display nice response to user
        }
    }


    const intervalId = setInterval(() => {
        // Check if the "Check Availability" button is now in the DOM
        var check_avail_button = document.querySelector("body > sc-app-root > sc-service-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-footer > button.btn.btn-blue");

        if (check_avail_button) {
            // Add the click event listener to the button
            console.log("EVENT LISTENER ADDED");
            check_avail_button.addEventListener("click", function () {
                const payload = validate_inputs();
                check_availability(payload);
            });

            // Stop checking once the button is found and event listener is attached
            clearInterval(intervalId);
        }
        console.log("BUTTON NOT FOUND");
    }, 100); // Check every 100ms
})();

