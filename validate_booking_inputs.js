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

    /* 'date' is the js Date object */
    function convert_datetime_to_string(date) {
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

    function repeat_interval_to_int(repeat_interval) {
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
        const dropoff_datetime_string = convert_datetime_to_string(dropoff_datetime_obj);
        const type = "service"; // TODO: check if this changes
        const purpose = purpose_element.value;
        const dry_run = true; // TODO: confirm this does not change
        const repeat_interval = repeat_interval_to_int(repeat_interval_element.value);
        const end_datetime_string = convert_datetime_to_string(input_end_datetime_obj);

        // Get community ID
        const community_id = getBrowserStorageValue('activeCommunityId');

        // Get vehicle ID
        const vehicle_id_element = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > div > section:nth-child(1) > form > header > div > div.col-md-7 > div > div.title-data-item.strong.ng-star-inserted");
        vehicle_id_str = vehicle_id_element.innerHTML;
        var split_vehicle_id = vehicle_id_str.split(" ");
        var vehicle_id_int = parseInt(split_vehicle_id[1]);
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

    function processBadResponse(response, bad_dates, headers, body, curr_pickup_datetime_obj) {
        let errorString = "";
        switch(response.status) {
            case BAD_REQUEST:
                errorString = "Bad Request for recurring booking script\n API Call Headers: " + headers + "\nAPI Call Body: " + body + "\nResponse: " + response;
                break;
            case (INVALID_TOKEN || FORBIDDEN):
                errorString = "Invalid Token or Forbidden Access for recurring booking script\n API Call Headers: " + headers + "\nAPI Call Body: " + body + "\nResponse: " + response;
                /* Since we plan to retrieve the token from the browser's localStorage right before making the API call, 
                we can assume that we are getting the most up to date key. Highly unlikely that reattempting the request will work. 
                so we will not retry the request. */
                break;
            case NOT_FOUND:
                errorString = "API endpoint not found for recurring booking script\n API Call Headers: " + headers + "\nAPI Call Body: " + body + "\nResponse: " + response;
                break;
            case UNPROCESSABLE_CONTENT:
                console.log('Conflicting date found:', convert_datetime_to_string(curr_pickup_datetime_obj));
                bad_dates.append(convert_datetime_to_string(curr_pickup_datetime_obj));
                return;
            case TOO_MANY_REQUESTS:
                DELAY_AMMOUNT = DELAY_AMMOUNT * 1.8; // Increase delay by 80%
                errorString = "Too many requests for recurring booking script\n API Call Headers: " + headers + "\nAPI Call Body: " + body + "\nResponse: " + response;
                errorString += "\nDelay increased to: " + DELAY_AMMOUNT;

                if (DELAY_AMMOUNT > 3000) {
                    console.log('Delay is too long, stopping requests');
                    alert('API issue detected, please try again later. Developers have been notified');
                    errorString += "\nDelay is too long, stopping requests";
                    CRITICAL_ERROR(errorString);
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
                errorString = "Unexpected error for recurring booking script\n API Call Headers: " + headers + "\nAPI Call Body: " + body + "\nResponse: " + response;
                break;           
        }

        //API Call to Google sheet to log the error (future development) 
        CRITICAL_ERROR(errorString);
     
    }

    async function check_availability(payload) {
        const pickup_datetime_obj = new Date(payload.pickUpDatetime);
        const dropoff_datetime_obj = new Date(payload.dropOffDatetime);
        const repeat_end_datetime_obj = new Date(payload.endDatetime);
        const repeat_interval_int = payload['repeat-interval'];
        console.log("Checking availability of intervals of" + repeat_interval_int + " starting from " + convert_datetime_to_string(pickup_datetime_obj));

        // POST arguments for checking availability
        const url = POST_URL; // TODO: figure out safe usage of url and header referer
        const apiKey = getBrowserStorageValue('oauth')?.access_token;
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Referer': POST_HEADERS_REFERER,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"'
        };

        var bad_dates = [];
        var good_date_payloads = [];
        var curr_pickup_datetime_obj = pickup_datetime_obj;
        var curr_dropoff_datetime_obj = dropoff_datetime_obj;
        while (curr_pickup_datetime_obj <= repeat_end_datetime_obj) {
            const response_payload = {
                'pickUpDatetime': convert_datetime_to_string(curr_pickup_datetime_obj),
                'dropOffDatetime': convert_datetime_to_string(curr_dropoff_datetime_obj),
                'type': payload.type,
                'vehicle': payload.vehicle,
                'purpose': payload.purpose,
                'dry-run': payload["dry-run"],
                'community': payload.community
            };

            // Send POST to server
            var response;
            try {
                console.log('Attempting to send POST request...');
                response = await fetch(url, {
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
                processBadResponse(response, bad_dates, headers, body, convert_datetime_to_string(curr_pickup_datetime_obj));
                bad_dates.push(convert_datetime_to_string(curr_pickup_datetime_obj));
            } else {
                // Create payloads for valid dates to use for booking
                const good_date_payload = {
                    'pickUpDatetime': convert_datetime_to_string(curr_pickup_datetime_obj),
                    'dropOffDatetime': convert_datetime_to_string(curr_dropoff_datetime_obj),
                    'type': payload.type,
                    'vehicle': payload.vehicle,
                    'purpose': payload.purpose,
                    'dry-run': payload["dry-run"],
                    'community': payload.community
                };
                good_date_payloads.push(good_date_payload);
            }
            

            // Increment pickup and dropoff datetimes by the repeat interval
            curr_pickup_datetime_obj.setDate(curr_pickup_datetime_obj.getDate() + repeat_interval_int);
            curr_dropoff_datetime_obj.setDate(curr_dropoff_datetime_obj.getDate() + repeat_interval_int);

            new Promise(resolve => setTimeout(resolve, DELAY_AMMOUNT)); // Pause for 10ms
        }

        if (bad_dates.length == 0) {
            alert("All dates available"); // TODO: Display nice response to user
        } else {
            var output = "Bad Dates: ";
            for (let i=0; i < bad_dates.length; i++) {
                output = output + bad_dates[i] + " ";
            }
            alert(output); // TODO: Display nice response to user
            console.log("Valid Dates", good_dates);
            console.log("Invalid Dates", bad_dates);
        }

        return good_date_payloads;
    }

    // MAIN FUNCTION
    const booking_interval_id = setInterval(() => {
        // Check if the "Check Availability" button is now in the DOM
        var check_avail_button = document.querySelector("#new-check-availability-button");

        if (check_avail_button) {
            // Add the click event listener to the button
            check_avail_button.addEventListener("click", function () {
                console.log("CHECKING AVAILABILITY");
                const payload = validate_inputs();
                check_availability(payload);
            });

            // Stop checking once the button is found and event listener is attached
            clearInterval(booking_interval_id);
        }
    }, 100); // Check every 100ms
})();

