// ==UserScript==
// @name         Members Page
// @namespace    http://tampermonkey.net/
// @version      2024-09-27
// @description  try to take over the world!
// @author       You
// @match        https://admin.share.car/communities/694/customers/members*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    alert("add two buttons");

    // Function to add the buttons
    function addButtons() {
        var element = document.querySelector('.form-inline.filter-options.ng-untouched.ng-pristine.ng-valid');

        if (element) {
            const buttonDiv = document.createElement('div');
            buttonDiv.className = "form-group";

            const label = document.createElement('label');
            label.setAttribute('for', 'filterDate');
            label.textContent = 'Date';

            const input = document.createElement('input');
            input.id = 'filterStartDate';
            input.setAttribute('formcontrolname', 'date');
            input.setAttribute('placeholder', 'Regis Date');
            input.className = 'form-control ng-untouched ng-pristine ng-valid';
            input.setAttribute('type', 'date'); // Set input type to date

            buttonDiv.appendChild(label);
            buttonDiv.appendChild(document.createElement('br'));
            buttonDiv.appendChild(input);

            element.appendChild(buttonDiv);
        }
    }

    // Create a MutationObserver to watch for changes in the DOM
    const observer = new MutationObserver((mutations, obs) => {
        // Check if the element is now present
        if (document.querySelector('.form-inline.filter-options.ng-untouched.ng-pristine.ng-valid')) {
            addButtons();
            obs.disconnect(); // Stop observing once the element is found and buttons are added
        }
    });

    // Start observing the document for changes
    observer.observe(document, {
        childList: true,
        subtree: true
    });

})();