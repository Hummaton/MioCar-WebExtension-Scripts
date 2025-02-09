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
    var vehicle_id_str;

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
    
    /* 'date' is the js Date object */
    function convertDatetimeToString(date) {
        if (date instanceof Date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');

            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } else {
            console.error("Not a valid Date object");
        }
        return null;
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
        vehicle_id_str = vehicle_id_element.innerHTML;
        var vehicle_id_int = parseInt(vehicle_id_str.split(" ")[1]);
        console.log("VEHICLE ID", vehicle_id_int);

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
                we can assume that we are getting the most up to date key. Highly unlikely that reattempting the request will work. 
                so we will not retry the request. */
                break;
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
                    alert('API issue detected, please try again later. Developers have been notified');
                    error_string += "\nDelay is too long, stopping requests";
                    criticalError(error_string);
                    return;
                }
                break;
            case INTERNAL_SERVER_ERROR:
                console.log('Internal Server Error, please try again later');
                alert('Internal Server Error for ShareCar servers, please try again later');
                break;
            case SERVICE_UNAVAILABLE:
                console.log('Service Unavailable');
                alert('ShareCar servers unavailable, please try again later');
                break;
            default:
                console.log('An unexpected error occurred: ', response.status);
                console.log('Response:', response); 
                alert('An unexpected error occurred, please try again later');
                error_string = "Unexpected error for recurring booking script\n API Call Headers: " + headers + "\nAPI Call Body: " + body + "\nResponse: " + response;
                break;           
        }

        //API Call to Google sheet to log the error (future development) 
        criticalError(error_string);
     
    }

    function processBookingBadResponse() { // TODO: Handle error responses for booking
        return;
    }

    async function checkAvailability(payload) {
        const pickup_datetime_obj = new Date(payload.pickUpDatetime);
        const dropoff_datetime_obj = new Date(payload.dropOffDatetime);
        const repeat_end_datetime_obj = new Date(payload.endDatetime);
        const repeat_interval_int = payload['repeat-interval'];
        console.log("Checking availability of intervals of " + repeat_interval_int + " starting from " + convertDatetimeToString(pickup_datetime_obj) + " to " + convertDatetimeToString(repeat_end_datetime_obj));

        var bad_dates = [];
        var good_date_payloads = [];
        var curr_pickup_datetime_obj = pickup_datetime_obj;
        var curr_dropoff_datetime_obj = dropoff_datetime_obj;

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
            let requestHeaders = getPostHeader();
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
                processBadResponse(response, bad_dates, requestHeaders, requestBody, convertDatetimeToString(curr_pickup_datetime_obj));
            } else {
                // Create payloads for valid dates to use for booking
                const good_date_payload = {
                    'pickUpDatetime': convertDatetimeToString(curr_pickup_datetime_obj),
                    'dropOffDatetime': convertDatetimeToString(curr_dropoff_datetime_obj),
                    'type': payload.type,
                    'vehicle': payload.vehicle,
                    'purpose': payload.purpose
                };
                good_date_payloads.push(good_date_payload);
            }
            
            // Increment pickup and dropoff datetimes by the repeat interval
            curr_pickup_datetime_obj.setDate(curr_pickup_datetime_obj.getDate() + repeat_interval_int);
            curr_dropoff_datetime_obj.setDate(curr_dropoff_datetime_obj.getDate() + repeat_interval_int);

            await new Promise(resolve => setTimeout(resolve, DELAY_AMMOUNT)); // Pause for specified time to prevent rate limiting
        }

        
        if (good_date_payloads.length == 0) {
            alert("No dates available to book for the given range. Please choose another date"); // TODO: Display nice response to user
        } else if (bad_dates.length == 0) {
            alert("All dates available"); // TODO: Display nice response to user
        } else {
            var output = "Bad Dates:\n";
            for (let i = 0; i < bad_dates.length; i++) {
                output = output + bad_dates[i] + "\n";
            }
            alert(output); // TODO: Display nice response to user
        }
        console.log("Valid Dates", good_date_payloads);
        console.log("Invalid Dates", bad_dates);

        return good_date_payloads;
    }

    // BOOKING FUNCTIONALITY
    // good_date_payloads is a list of payloads for valid dates to book'
    async function bookAvailableDates(good_date_payloads) {

        if (good_date_payloads.length == 0 || good_date_payloads == null) {
            alert("No valid dates to book");
            return;
        }

        for (let i = 0; i < good_date_payloads.length; i++) {
            // Send POST to server
            var response;
            try {
                console.log('Attempting to send POST request for booking creation... on date:', good_date_payloads[i].pickUpDatetime);
                response = await fetch(url, {
                    method: 'POST',
                    headers: getPostHeader(),
                    body: JSON.stringify(good_date_payloads[i])
                });
                console.log('Status Code:', response.status);
            } catch (error) {
                console.error('Error making POST request:', error);
            }

            // Handle POST responses
            if (!(response.status == CREATED)) {
                // TODO: Check for 4** errors and handle below
                processBookingBadResponse();
            }

            await new Promise(resolve => setTimeout(resolve, DELAY_AMMOUNT)); // Pause for 10ms
        }

        alert("All bookings attempted");
        // TODO: ALERT USER OF ALL BOOKINGS MADE AND IF ANY WERE UNSUCCESSFUL

    }

    
    // MAIN FUNCTION
    const booking_interval_id = setInterval(() => {
        // Replacing 'Check Availability Button' and add functionality
        var curr_check_avail_button = document.querySelector("body > sc-app-root > sc-service-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-footer > button.btn.btn-blue");
        var repeat_interval_select_element = document.querySelector("#repeatInterval");
        var repeat_end_date_input_element = document.querySelector("#input-end-date");
        var new_check_avail_element = document.querySelector("#new-check-availability-button");

        var checked_input;
        var good_date_payloads;


        if (curr_check_avail_button && !new_check_avail_element && repeat_interval_select_element.value != 'undefined' && repeat_end_date_input_element.value != '') {
            console.log("Removed old Check Availability");
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
                    good_date_payloads = await checkAvailability(checked_input);
                }
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

            const create_booking_parent_div = document.querySelector("body > sc-app-root > sc-service-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-footer");
            create_booking_parent_div.insertBefore(new_create_booking_button, create_booking_parent_div.children[2]);

            new_create_booking_button.addEventListener("click", async function () {
                console.log("CREATE BOOKING");
                
                var form_changed = JSON.stringify(checked_input) === JSON.stringify(validateInputs()) ? false : true;

                if (form_changed) {
                    alert('Form changed, recheck availability');
                } else {
                    console.log('Form not changed, proceed to booking');
                    console.log('Good Date Payloads:', good_date_payloads);

                    bookAvailableDates(good_date_payloads);
                }
                
            });

            // Stop checking once the button is found and event listener is attached
            clearInterval(booking_interval_id);
        }

    }, 100); // Check every 100ms
})();

