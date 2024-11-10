// ==UserScript==
// @name         Members Page
// @namespace    http://tampermonkey.net/
// @version      2024-09-27
// @description  Adds date selection buttons to the members page
// @author       You
// @match        https://admin.share.car/communities/694/customers/members*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @updateURL    https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/date_selection_members.js
// @downloadURL  https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/date_selection_members.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Alert to indicate the script is running
    alert("add two buttons");

    // Function to add the date selection buttons
    function addButtons() {
        // Select the target element where buttons will be added
        var filterForm = document.querySelector('.form-inline.filter-options.ng-untouched.ng-pristine.ng-valid');

        if (filterForm) {
            // Create container for Register Start Date input
            const startButtonDiv = document.createElement('div');
            startButtonDiv.className = "form-group";

            // Create label for Register Start Date input
            const startLabel = document.createElement('label');
            startLabel.setAttribute('for', 'filterStartDate');
            startLabel.textContent = 'Register Start Date';

            // Create input for Register Start Date
            const startInput = document.createElement('input');
            startInput.id = 'filterStartDate';
            startInput.setAttribute('formcontrolname', 'date');
            startInput.setAttribute('placeholder', 'Regis Start Date');
            startInput.className = 'form-control ng-untouched ng-pristine ng-valid';
            startInput.setAttribute('type', 'date'); // Set input type to date

            // Append label and input to the container
            startButtonDiv.appendChild(startLabel);
            startButtonDiv.appendChild(document.createElement('br'));
            startButtonDiv.appendChild(startInput);

            // Append the container to the target element
            filterForm.appendChild(startButtonDiv);

            // Create container for Register End Date input
            const endButtonDiv = document.createElement('div');
            endButtonDiv.className = "form-group";

            // Create label for Register End Date input
            const endLabel = document.createElement('label');
            endLabel.setAttribute('for', 'filterEndDate');
            endLabel.textContent = 'Register End Date';

            // Create input for Register End Date
            const endInput = document.createElement('input');
            endInput.id = 'filterEndDate';
            endInput.setAttribute('formcontrolname', 'date');
            endInput.setAttribute('placeholder', 'Regis End Date');
            endInput.className = 'form-control ng-untouched ng-pristine ng-valid';
            endInput.setAttribute('type', 'date'); // Set input type to date

            // Append label and input to the container
            endButtonDiv.appendChild(endLabel);
            endButtonDiv.appendChild(document.createElement('br'));
            endButtonDiv.appendChild(endInput);

            // Append the container to the form 
            filterForm.appendChild(endButtonDiv);
        }
    }

    // Create a MutationObserver to watch for changes in the DOM
    const observer = new MutationObserver((mutations, obs) => {
        // Check if the target (form) element is now loaded in the DOM
        if (document.querySelector('.form-inline.filter-options.ng-untouched.ng-pristine.ng-valid')) {
            addButtons(); // Add the buttons
            obs.disconnect(); // Stop observing once the element is found and buttons are added
        }
    });

    // Start observing the document for changes in the DOM
    observer.observe(document, {
        childList: true, 
        subtree: true   
    });

})();