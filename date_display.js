// ==UserScript==
// @name         Signup Date Display
// @namespace    http://tampermonkey.net/
// @version      2024-09-30
// @description  try to take over the world!
// @author       You
// @match        https://admin.share.car/communities/694/customers/members*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @grant        none
// ==/UserScript==

(function() {
    'use strict';


    // Function to add the date selection buttons
    function addColumn() {
        // Select the target element where buttons will be added
        var table = document.querySelector('#membersTable');

        if (table) {
            alert("Table found")
        }
    }

    // Create a MutationObserver to watch for changes in the DOM
    const observer = new MutationObserver((_, obs) => {
        // Check if the target (form) element is now loaded in the DOM
        if (document.querySelector('#membersTable')) {
            addColumn(); // Add the buttons
            obs.disconnect(); // Stop observing once the element is found and buttons are added
        }
    });

    // Start observing the document for changes in the DOM
    observer.observe(document, {
        childList: true,
        subtree: true
    });

})();

