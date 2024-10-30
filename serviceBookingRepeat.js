// ==UserScript==
// @name         Recurring Service Booking Addition
// @namespace    http://tampermonkey.net/
// @version      2024-10-14
// @description  try to take over the world!
// @author       You
// @match        https://admin.share.car/communities/671/fleet/vehicles/11369
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function addButtons() {
        var lowerRow = document.querySelector('.modal-footer');
        
        if (!lowerRow) {
            alert('The element .modal-footer is not found in the DOM.');
            return;
        }
        
        // Check if the button already exists
        if (!document.getElementById('recurring-booking-button')) {
            var newButton = document.createElement('button');

            //Add the style attributes to the button
            newButton.className = 'btn btn-success';
            newButton.style.backgroundColor = 'maroon';
            newButton.id = 'recurring-booking-button';
            newButton.textContent = 'Recurring Booking';

            lowerRow.appendChild(newButton);
        }
    }
    

    function changeSingleBookingButtonName() {
        var lowerRow = document.querySelector('.modal-footer');
        if (lowerRow) {
            // query the second child of the modal footer (button)
            var button = lowerRow.children[1];
            
            //Change the button text to 'Single Service Booking'
            button.innerHTML = 'Single Booking';
        }
    }

    const observer = new MutationObserver((_, obs) => {
        // Check if the target (form) element is now loaded in the DOM
        if (document.querySelector(".modal-footer")) {
            //wait for 2 seconds
            setTimeout(() => {
                changeSingleBookingButtonName();
                addButtons();   
                obs.disconnect();
            }, 200);
        }
    });

    // Start observing the document for changes in the DOM
    observer.observe(document, {
        childList: true,
        subtree: true
    });

})();
