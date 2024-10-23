// ==UserScript==
// @name         Export License Data
// @namespace    http://tampermonkey.net/
// @version      2024-10-23
// @description  try to take over the world!
// @author       You
// @match        https://admin.share.car/communities/671/customers/members/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // Function to add the recurring service booking options
    function addButtons() {
        // Select the target element where buttons will be added
        var lowerRow = document.querySelector('.modal-body');

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

    // Create a MutationObserver to watch for changes in the DOM
    const observer = new MutationObserver(() => {
        // Check if the target (form) element is now loaded in the DOM
        
        /// TODO: Find the element you want to observe and insert into the querySelector below
        // if (document.querySelector("INSERT ELEMENT TO OBSERVE HERE")) {
        //     //wait for 0.1 seconds
        //     setTimeout(addButtons, 100);
        // }


    });

    // Start observing the document for changes in the DOM
    observer.observe(document, {
        childList: true,
        subtree: true
    });

})();