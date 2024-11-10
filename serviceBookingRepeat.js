// ==UserScript==
// @name         Recurring Service Booking Addition
// @namespace    http://tampermonkey.net/
// @version      2024-10-14
// @description  Add recurring booking button
// @match        https://admin.share.car/communities/671/fleet/vehicles/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/serviceBookingRepeat.js
// @downloadURL  https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/serviceBookingRepeat.js
// ==/UserScript==

(function() {
    'use strict';

    function addButtons() {
        const lowerRow = document.querySelector('.modal-footer');

        // Check if the button already exists
        if (!document.getElementById('recurring-booking-button') && lowerRow) {
            const newButton = document.createElement('button');

            // Add the style attributes to the button
            newButton.className = 'btn btn-success';
            newButton.id = 'recurring-booking-button';
            newButton.style.backgroundColor = 'maroon';
            newButton.textContent = 'Recurring Booking';

            lowerRow.appendChild(newButton);
        }
    }

    function changeSingleBookingButtonName() {
        const lowerRow = document.querySelector('.modal-footer');
        // Check if the button already exists
        if (lowerRow && lowerRow.children[1]) {
            // Change the button text to 'Single Booking'
            lowerRow.children[1].innerHTML = 'Single Booking';
        }
    }

    function main() {
        alert("hello")
        const observer = new MutationObserver(() => {
            // Check if the target (modal footer) element is now loaded in the DOM
            if (document.querySelector(".modal-footer")) {
                // Wait for 100ms
                setTimeout(() => {
                    changeSingleBookingButtonName();
                    addButtons();
                }, 100);
            }
        });

        // Start observing the document for changes in the DOM
        observer.observe(document, {
            childList: true,
            subtree: true
        });

        // Reinitialize the observer each time we close the popup
        document.addEventListener('click', function(event) {
            if (event.target.closest('.close-button')) {
                observer.disconnect();
                setTimeout(main, 200); // Add a delay before reinitializing the observer
            }
        });
    }

    // Initial observer setup
    main();

})();
