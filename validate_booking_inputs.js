// ==UserScript==
// @name         Validate Bookings
// @namespace    http://tampermonkey.net/
// @version      2025-01-21
// @description  try to take over the world!
// @author       You
// @match        https://admin.share.car/communities/*/fleet/vehicles/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @require      https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/serviceBooking_dev/utilities.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    /* HTTP Responses */
    // The HTTP 201 Created successful response status code indicates that the HTTP request has led to the creation of a resource.
    const CREATED = 201;

    /* The HyperText Transfer Protocol (HTTP) 400 Bad Request response status code indicates that the server cannot or will not process the request due to
    something that is perceived to be a client error (e.g., malformed request syntax, invalid request message framing, or deceptive request routing). */
    const BAD_REQUEST = 400;

    // The HTTP 401 Unauthorized client error status response code indicates that the request has not been applied because it lacks valid authentication credentials for the target resource.
    const INVALID_TOKEN = 401;

    // The HTTP 403 Forbidden client error status response code indicates that the server understood the request but refuses to authorize it.
    const FORBIDDEN = 403;

    // The HTTP 404 Not Found client error response code indicates that the server can't find the requested resource.
    const NOT_FOUND = 404;

    // The HTTP 422 Unprocessable Content client error response status code indicates that the server understood the content type of the request content, and the syntax of the request content was correct, but it was unable to process the contained instructions.
    const UNPROCESSABLE_CONTENT = 422;

    // The HTTP 429 Too Many Requests response status code indicates the user has sent too many requests in a given amount of time ("rate limiting").
    const TOO_MANY_REQUESTS = 429;

    // The HTTP 500 Internal Server Error server error response code indicates that the server encountered an unexpected condition that prevented it from fulfilling the request.
    const INTERNAL_SERVER_ERROR = 500;

    // The HTTP 503 Service Unavailable server error response code indicates that the server is not ready to handle the request.
    const SERVICE_UNAVAILABLE = 503;

    let DELAY_AMMOUNT = 100; // 0.1s wait time between making API requests to prevent rate limiting, server overload, packet loss, etc.

    // POST arguments for API call
    /************* FILL IN FOR PRODUCTION SCRIPT  */
    const url = API_ENDPOINT;
    const referer = POST_HEADERS_REFERER;
    /************* FILL IN FOR PRODUCTION SCRIPT  */

    function getPostHeader() {
        const apiKey = getBrowserStorageValue('oauth')?.access_token;
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Referer': referer,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"'
        };

        return headers;
    }

    function repeatIntervalToInt(repeat_interval) {
        // ['Daily', 'Weekly', 'Bi-Weekly', 'Monthly', 'Yearly']
        var repeat_interval_int = 0;
        switch(repeat_interval) {
            case 'daily':
                repeat_interval_int = 1;
                break;
            case 'weekly':
                repeat_interval_int = 7;
                break;
            case 'bi-weekly':
                repeat_interval_int = 14;
                break;
            case 'monthly':
                repeat_interval_int = 30;
                break;
            case 'yearly':
                repeat_interval_int = 365;
                break;
            default:
                alert('Invalid repeat interval type');
                console.log('Invalid repeat interval type:', repeat_interval);
        }

        return repeat_interval_int;
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
        const pickup_datetime_string = convertDatetimeToString(pickup_datetime_obj);
        const dropoff_datetime_string = convertDatetimeToString(dropoff_datetime_obj);
        const type = "service";
        const purpose = purpose_element.value;
        const dry_run = true; // Dry run paramter required to check availability
        const repeat_interval = repeatIntervalToInt(repeat_interval_element.value);
        const end_datetime_string = convertDatetimeToString(input_end_datetime_obj);

        // Get community ID
        const community_id = getBrowserStorageValue('activeCommunityId');

        // Get vehicle ID
        const vehicle_id_element = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > div > section:nth-child(1) > form > header > div > div.col-md-7 > div > div.title-data-item.strong.ng-star-inserted");
        const vehicle_id_str = vehicle_id_element.innerHTML;
        var vehicle_id_int = parseInt(vehicle_id_str.split(" ")[1]);

        const payload = {
            'pickUpDatetime': pickup_datetime_string,
            'dropOffDatetime': dropoff_datetime_string,
            'type': type,
            'vehicle': vehicle_id_int,
            'purpose': purpose,
            'dry-run': dry_run,
            'community': community_id,
            'repeat-interval': repeat_interval,
            'endDatetime': end_datetime_string
        }
        return payload;

    }

    function processBadResponse(response, bad_dates, headers, body, curr_pickup_datetime) {
        let error_string = "";
        switch(response.status) {
            case BAD_REQUEST:
                error_string = "Bad Request for recurring booking script\n API Call Headers: " + headers + "\nAPI Call Body: " + body + "\nResponse: " + response;
                break;
            case (INVALID_TOKEN || FORBIDDEN):
                error_string = "Invalid Token or Forbidden Access for recurring booking script\n API Call Headers: " + headers + "\nAPI Call Body: " + body + "\nResponse: " + response;
                /* Since we plan to retrieve the token from the browser's localStorage right before making the API call,
                we can assume that we are getting the most up to date key. If the key is invalid, the user should refresh the page" */
                alert('Invalid API token, please refresh the page'); //TODO: Integrate this into the red error box div to display nicely
                return;
            case NOT_FOUND:
                error_string = "API endpoint not found for recurring booking script\n API Call Headers: " + headers + "\nAPI Call Body: " + body + "\nResponse: " + response;
                break;
            case UNPROCESSABLE_CONTENT:
                console.log('Conflicting date found:', curr_pickup_datetime);
                bad_dates.push(curr_pickup_datetime);
                return;
            case TOO_MANY_REQUESTS:
                DELAY_AMMOUNT = DELAY_AMMOUNT * 1.8; // Increase delay by 80%
                error_string = "Too many requests for recurring booking script\n API Call Headers: " + headers + "\nAPI Call Body: " + body + "\nResponse: " + response;
                error_string += "\nDelay increased to: " + DELAY_AMMOUNT;

                if (DELAY_AMMOUNT > 3000) {
                    console.log('Delay is too long, stopping requests');
                    alert('API issue detected, please try again later. Developers have been notified'); // TODO: Integrate this into the red error box div to display nicely
                    error_string += "\nDelay is too long, stopping requests";
                    criticalError(error_string);
                    return;
                }
                break;
            case INTERNAL_SERVER_ERROR:
                console.log('Internal Server Error, please try again later');
                alert('Internal Server Error for ShareCar servers, please try again later'); //TODO: Integrate this into the red error box div to display nicely
                break;
            case SERVICE_UNAVAILABLE:
                console.log('Service Unavailable');
                alert('ShareCar servers unavailable, please try again later'); //TODO: Integrate this into the red error box div to display nicely
                break;
            default:
                console.log('An unexpected error occurred: ', response.status);
                console.log('Response:', response);
                alert('An unexpected error occurred, please try again later'); //TODO: Integrate this into the red error box div to display nicely
                error_string = "Unexpected error for recurring booking script\n API Call Headers: " + headers + "\nAPI Call Body: " + body + "\nResponse: " + response;
                break;
        }

        //API Call to Google sheet to log the error (future development)
        criticalError(error_string);
    }

    function createRedMessage(str) {
        const message_container_div = document.querySelector("body > sc-app-root > sc-service-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-body > div:nth-child(4) > div");
        message_container_div.style.display = "flex";
        message_container_div.style.gap = "10px";
        message_container_div.style.justifyContent = "center";
        var message_div = document.querySelector("#red-message");

        if (message_div) {
            message_div.innerHTML = str;
        } else {
            message_div = document.createElement('div');
            message_div.id = 'red-message';
            message_div.className = 'alert alert-danger ng-star-inserted';
            message_div.innerHTML = str;
            message_div.style.flex = "1";

            message_container_div.appendChild(message_div);
        }
    }

    function createGreenMessage(str) {
        const message_container_div = document.querySelector("body > sc-app-root > sc-service-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-body > div:nth-child(4) > div");
        message_container_div.style.display = "flex";
        message_container_div.style.gap = "10px";
        message_container_div.style.justifyContent = "center";
        var message_div = document.querySelector("#green-message");

        if (message_div) {
            message_div.innerHTML = str;
        } else {
            message_div = document.createElement('div');
            message_div.id = 'green-message';
            message_div.className = 'alert alert-success ng-star-inserted';
            message_div.innerHTML = str;
            message_div.style.flex = "1";

            message_container_div.appendChild(message_div);
        }
    }

    function removeMessages() {
        // revert message container to old styling
        const message_container_div = document.querySelector("body > sc-app-root > sc-service-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-body > div:nth-child(4) > div");
        message_container_div.style.display = "block";
        message_container_div.style.gap = "";
        message_container_div.style.justifyContent = "";

        var green_message_div = document.querySelector("#green-message");
        if (green_message_div) {
            green_message_div.remove();
        }

        var red_message_div = document.querySelector("#red-message");
        if (red_message_div) {
            red_message_div.remove();
        }
    }

    async function checkAvailability(payload) {
        if (payload == null) {
            alert("Invalid payload");
            return;
        }

        const pickup_datetime_obj = new Date(payload.pickUpDatetime);
        const dropoff_datetime_obj = new Date(payload.dropOffDatetime);
        const repeat_end_datetime_obj = new Date(payload.endDatetime);
        const repeat_interval_int = payload['repeat-interval'];
        console.log("Checking availability of intervals of " + repeat_interval_int + " starting from " + convertDatetimeToString(pickup_datetime_obj) + " to " + convertDatetimeToString(repeat_end_datetime_obj));

        var invalid_dates = [];
        var valid_date_payloads = [];
        var curr_pickup_datetime_obj = pickup_datetime_obj;
        var curr_dropoff_datetime_obj = dropoff_datetime_obj;
        let requestHeaders = getPostHeader();

        // Incrementally check availability for each date in the range
        while (curr_pickup_datetime_obj <= repeat_end_datetime_obj) {
            const request_payload = {
                'pickUpDatetime': convertDatetimeToString(curr_pickup_datetime_obj),
                'dropOffDatetime': convertDatetimeToString(curr_dropoff_datetime_obj),
                'type': payload.type,
                'vehicle': payload.vehicle,
                'purpose': payload.purpose,
                'dry-run': payload["dry-run"],
                'community': payload.community
            };

            // Initialize response and POST API request fields
            var response;
            let requestBody = JSON.stringify(request_payload);

            // Send POST to server
            try {
                console.log('Attempting to send POST request...');
                response = await fetch(url, {
                    method: 'POST',
                    headers: requestHeaders,
                    body: requestBody
                });
                console.log('Status Code:', response.status);
            } catch (error) {
                console.error('Error making POST request:', error);
            }

            // Handle POST responses
            if (!(response.status == CREATED)) {
                processBadResponse(response, invalid_dates, requestHeaders, requestBody, convertDatetimeToString(curr_pickup_datetime_obj));
            } else {
                // Create payloads for valid dates to use for booking
                const valid_date_payload = {
                    'pickUpDatetime': convertDatetimeToString(curr_pickup_datetime_obj),
                    'dropOffDatetime': convertDatetimeToString(curr_dropoff_datetime_obj),
                    'type': payload.type,
                    'vehicle': payload.vehicle,
                    'purpose': payload.purpose
                };
                valid_date_payloads.push(valid_date_payload);
            }

            // Increment pickup and dropoff datetimes by the repeat interval
            if (repeat_interval_int == 30) { // monthly
                curr_pickup_datetime_obj.setMonth(curr_pickup_datetime_obj.getMonth() + 1);
                curr_dropoff_datetime_obj.setMonth(curr_dropoff_datetime_obj.getMonth() + 1);
            } else if (repeat_interval_int == 365) { // yearly
                curr_pickup_datetime_obj.setFullYear(curr_pickup_datetime_obj.getFullYear() + 1);
                curr_dropoff_datetime_obj.setFullYear(curr_dropoff_datetime_obj.getFullYear() + 1);
            } else { // daily, weekly, biweekly
                curr_pickup_datetime_obj.setDate(curr_pickup_datetime_obj.getDate() + repeat_interval_int);
                curr_dropoff_datetime_obj.setDate(curr_dropoff_datetime_obj.getDate() + repeat_interval_int);
            }

            await new Promise(resolve => setTimeout(resolve, DELAY_AMMOUNT)); // Pause for specified time to prevent rate limiting
        }


        // DISPLAY AVAILABLE DATES
        console.log("DISPLAY AVAILABLE DATES");
        const check_avail_element = document.querySelector("#new-check-availability-button");
        const create_booking_button = document.querySelector("#new-create-booking-button");
        if (valid_date_payloads.length == 0) {
            removeMessages();
            const only_invalid_dates_msg = "No dates available to book for the given range. Please choose another date.";
            createRedMessage(only_invalid_dates_msg);
        } else if (invalid_dates.length == 0) {
            removeMessages();

            var only_valid_dates_msg = "All dates available:<br />";
            for (let i = 0; i < valid_date_payloads.length; i++) {
                var valid_date = new Date(valid_date_payloads[i].pickUpDatetime);
                valid_date = valid_date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

                only_valid_dates_msg = only_valid_dates_msg + valid_date + "<br />";
            }
            createGreenMessage(only_valid_dates_msg);

            check_avail_element.disabled = true;
            create_booking_button.disabled = false;
        } else {
            removeMessages();

            var valid_dates_msg = "Available Dates:<br />";
            for (let i = 0; i < valid_date_payloads.length; i++) {
                var valid_date = new Date(valid_date_payloads[i].pickUpDatetime);
                valid_date = valid_date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

                valid_dates_msg = valid_dates_msg + valid_date + "<br />";
            }
            createGreenMessage(valid_dates_msg);

            var invalid_dates_msg = "Unavailable Dates:<br />";
            for (let i = 0; i < invalid_dates.length; i++) {
                var invalid_date = new Date(invalid_dates[i]);
                invalid_date = invalid_date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

                invalid_dates_msg = invalid_dates_msg + invalid_date + "<br />";
            }
            createRedMessage(invalid_dates_msg);

            check_avail_element.disabled = true;
            create_booking_button.disabled = false;
        }
        console.log("Valid Dates", valid_date_payloads);
        console.log("Invalid Dates", invalid_dates);

        return valid_date_payloads;
    }

    // BOOKING FUNCTIONALITY
    // valid_date_payloads is a list of payloads for valid dates to book'
    async function bookAvailableDates(valid_date_payloads) {

        if (valid_date_payloads.length == 0 || valid_date_payloads == null) {
            alert("No valid dates to book");
            return;
        }

        var error_booking_dates = [];

        // Initialize response and POST API request fields
        var response;
        let requestHeaders = getPostHeader();


        for (let i = 0; i < valid_date_payloads.length; i++) {
            let requestBody = JSON.stringify(valid_date_payloads[i]);

            // Send POST to server
            try {
                console.log('Attempting to send POST request for booking creation... on date:', valid_date_payloads[i].pickUpDatetime);
                response = await fetch(url, {
                    method: 'POST',
                    headers: requestHeaders,
                    body: requestBody
                });
                console.log('Booking made. Status Code:', response.status);
            } catch (error) {
                console.error('Error making POST request:', error);
            }

            // Handle POST responses
            if (!(response.status == CREATED)) {
                // Extract date of failed booking
                var error_datetime_str = valid_date_payloads[i].pickUpDatetime;
                processBadResponse(response, error_booking_dates, requestHeaders, requestBody, error_datetime_str);
            }
            await new Promise(resolve => setTimeout(resolve, DELAY_AMMOUNT)); // Pause for 10ms
        }

        // Remove elements from good date payloads that are contained in error_booking_dates
        valid_date_payloads = valid_date_payloads.filter(obj => !error_booking_dates.includes(obj.pickUpDatetime));

        console.log("Bookings created for Dates", valid_date_payloads);

        // Create message displaying booked dates
        removeMessages();
        var only_valid_dates_msg = "Booked the following dates:<br />";
        for (let i = 0; i < valid_date_payloads.length; i++) {
            var valid_date = new Date(valid_date_payloads[i].pickUpDatetime);
            valid_date = valid_date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

            only_valid_dates_msg = only_valid_dates_msg + valid_date + "<br />";
        }
        createGreenMessage(only_valid_dates_msg);

        if (error_booking_dates.length > 0) {
            console.log("Error Booking for Dates", error_booking_dates);

            var error_booking_dates_msg = "Error Booking Dates: <br />";
            for (let i = 0; i < error_booking_dates.length; i++) {
                var error_booking_date = new Date(error_booking_dates[i]);
                error_booking_date = error_booking_date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

                error_booking_dates_msg = error_booking_dates_msg + error_booking_date + "<br />";
            }
            createRedMessage(error_booking_dates_msg);
        }

        // TODO: What happens to buttons and how they are disabled after creating booking
    }


    // MAIN FUNCTION
    const booking_interval_id = setInterval(() => {
        var checked_input;
        var valid_date_payloads;

        var curr_check_avail_button = document.querySelector("body > sc-app-root > sc-service-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-footer > button.btn.btn-blue");
        var repeat_interval_select_element = document.querySelector("#repeatInterval");
        var repeat_end_date_input_element = document.querySelector("#input-end-date");
        var new_check_avail_element = document.querySelector("#new-check-availability-button");

        if (curr_check_avail_button && !new_check_avail_element && repeat_interval_select_element.value != 'undefined' && repeat_end_date_input_element.value != '') {
            console.log("Remove Check Availability");
            curr_check_avail_button.style.display = 'none';

            // Create New Check Availability Button
            const new_check_avail_button = document.createElement('button');
            new_check_avail_button.type = 'button';
            new_check_avail_button.id = 'new-check-availability-button';
            new_check_avail_button.className = 'btn btn-blue';
            new_check_avail_button.innerHTML = 'New Check Availability'; // TODO: Change to wanted button name later

            const check_availability_parent_div = document.querySelector("body > sc-app-root > sc-service-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-footer");
            check_availability_parent_div.insertBefore(new_check_avail_button, check_availability_parent_div.children[1]);

            // Add the click event listener to the button
            new_check_avail_button.addEventListener("click", async function () {
                console.log("CHECKING AVAILABILITY");
                checked_input = validateInputs();
                if (checked_input) {
                    valid_date_payloads = await checkAvailability(checked_input);
                }
            });

            // When form is changed, make 'check availability' button clickable and 'create booking' button unclickable
            let form = document.querySelector("form[name='serviceBooking']");
            form.addEventListener("change", function (event) {
                new_check_avail_button.disabled = false;
                var create_booking_element = document.querySelector("#new-create-booking-button");
                create_booking_element.disabled = true;
            });

            // Stop checking once the button is found and event listener is attached
            clearInterval(booking_interval_id);
        }

        // Replacing 'Create Booking' button and add functionality
        var curr_create_booking_button = document.querySelector("body > sc-app-root > sc-service-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-footer > button.btn.btn-success");
        var new_create_booking_element = document.querySelector("#new-create-booking-button");

        if (curr_create_booking_button && !new_create_booking_element && repeat_interval_select_element.value != 'undefined' && repeat_end_date_input_element.value != '') {
            console.log("Remove Create Booking");
            curr_create_booking_button.style.display = 'none';

            const new_create_booking_button = document.createElement('button');
            new_create_booking_button.type = 'button';
            new_create_booking_button.id = 'new-create-booking-button';
            new_create_booking_button.className = 'btn btn-success';
            new_create_booking_button.innerHTML = 'New Create Booking'; // TODO: Change to wanted button name later
            new_create_booking_button.disabled = true;

            const create_booking_parent_div = document.querySelector("body > sc-app-root > sc-service-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-footer");
            create_booking_parent_div.insertBefore(new_create_booking_button, create_booking_parent_div.children[2]);

            new_create_booking_button.addEventListener("click", async function () {
                var form_changed = JSON.stringify(checked_input) === JSON.stringify(validateInputs()) ? false : true;

                if (form_changed) {
                    alert('Form changed, recheck availability'); // TODO: Change to wanted button name later
                } else {
                    console.log('Form not changed, proceed to booking');
                    console.log('Valid Date Payloads:', valid_date_payloads);

                    bookAvailableDates(valid_date_payloads);
                }

            });

            // Stop checking once the button is found and event listener is attached
            clearInterval(booking_interval_id);
        }

    }, 100); // Check every 100ms
})();
