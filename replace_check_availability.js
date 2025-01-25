// ==UserScript==
// @name         Replace Check Availability
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

    function listen_for_check_availability_button_click() {
        const check_avail_button = document.querySelector("#new-check-availability-button");
        check_avail_button.addEventListener("click", function() {
            // Code to execute when the button is clicked
            alert("Maybe do something");
        });
    }

    const intervalId = setInterval(() => {
        // Check if Repeat Interval and Repeat End Date are BOTH filled before replacing "Check Availability" button
        var curr_check_avail_button = document.querySelector("body > sc-app-root > sc-service-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-footer > button.btn.btn-blue");
        var repeat_interval_select_element = document.querySelector("#repeatInterval");
        var repeat_end_date_input_element = document.querySelector("#input-end-date");
        var new_check_avail_element = document.querySelector("#new-check-availability-button");

        if (curr_check_avail_button && !new_check_avail_element && repeat_interval_select_element.value != 'undefined' && repeat_end_date_input_element.value != '') {
            console.log("Remove Check Availability");
            curr_check_avail_button.style.display = 'none';

            const new_check_avail_button = document.createElement('button');
            new_check_avail_button.type = 'button';
            new_check_avail_button.id = 'new-check-availability-button';
            new_check_avail_button.className = 'btn btn-blue';
            new_check_avail_button.innerHTML = 'New Check Availability';

            const check_availability_parent_div = document.querySelector("body > sc-app-root > sc-service-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-footer");
            check_availability_parent_div.insertBefore(new_check_avail_button, check_availability_parent_div.children[1]);

            listen_for_check_availability_button_click();
        }
    }, 100); // Check every 100ms




})();