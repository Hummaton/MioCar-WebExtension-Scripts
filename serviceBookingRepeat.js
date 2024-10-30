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

    // Function to add the recurring service booking options
    function addButtons() {
        // Select the target element where buttons will be added
        var lowerRow = document.querySelector('.modal-footer');

        if (lowerRow) {
            // query the third child of the lowerRow which is a div with class 'row'
            var row = lowerRow.children[2];

            if (row) {
                // Check if the button already exists to avoid adding it multiple times
                if (!row.querySelector('.btn-primary')) {
                    // Create the button element
                    var button = document.createElement('button');
                    button.innerHTML = 'Recurring Service Booking';
                    button.className = 'btn btn-primary';
                    button.style.marginLeft = '10px';
                    button.style.marginRight = '10px';

                    // Add the button to the row
                    row.appendChild(button);
                }
            }
        }
    }

    function changeSingleBookingButtonName() {
        var lowerRow = document.querySelector('.modal-footer');
        if (lowerRow) {
            // query the second child of the modal footer (button)
            var button = lowerRow.children[1];
            
            //Change the button text to 'Single Service Booking'
            button.innerHTML = 'Single Service Booking';
        }
    }

    // Create a MutationObserver to watch for changes in the DOM
    const observer = new MutationObserver((mutations, obs) => {
        // Check if the target (form) element is now loaded in the DOM
        if (document.querySelector(".modal-footer")) {
            //wait for 2 seconds
            setTimeout(() => {

                // addButtons();   not working as of right now 

                changeSingleBookingButtonName();
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
