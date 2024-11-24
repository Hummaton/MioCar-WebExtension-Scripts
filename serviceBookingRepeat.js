// ==UserScript==
// @name         Recurring Service Booking Addition
// @namespace    http://tampermonkey.net/
// @version      2024-11-09
// @description  Add recurring booking button
// @match        https://admin.share.car/communities/671/fleet/vehicles/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/serviceBookingRepeat.js
// @downloadURL  https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/serviceBookingRepeat.js
// ==/UserScript==

(function() {
    'use strict';

    function addRepeatIntervalMenu() {
        const serviceBookingMenuRow = document.querySelector("body > sc-app-root > sc-service-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-body > div:nth-child(3)")

        // Check if the button already exists
        if (!document.getElementById('recurring-booking-element') && serviceBookingMenuRow) {
            const recurringBookingDiv = document.createElement('div');
            recurringBookingDiv.id = 'recurring-booking-element';
            recurringBookingDiv.className = 'col-md-6';

            const label = document.createElement('label');
            label.setAttribute('for', 'repeatInterval');
            label.textContent = 'Repeat Interval';

            const selectDiv = document.createElement('div');
            selectDiv.className = 'custom-select form-control-md';

            const select = document.createElement('select');
            select.id = 'repeatInterval';
            select.name = 'repeatInterval';
            select.className = 'ng-untouched ng-pristine ng-valid';

            const optionDefault = document.createElement('option');
            optionDefault.selected = true;
            optionDefault.value = 'undefined';
            optionDefault.textContent = 'Select...';

            const options = ['Daily', 'Weekly', 'Bi-Weekly', 'Monthly', 'Yearly'];
            options.forEach(optionText => {
                const option = document.createElement('option');
                option.textContent = optionText;
                option.value = optionText.toLowerCase().replace(/ /g, '-');
                select.appendChild(option);
            });

            select.appendChild(optionDefault);
            selectDiv.appendChild(select);

            recurringBookingDiv.appendChild(label);
            recurringBookingDiv.appendChild(selectDiv);

            

            if (serviceBookingMenuRow) {
                serviceBookingMenuRow.appendChild(recurringBookingDiv);
            }
    }
}


function addIntervalStopDate() {
    const serviceBookingMenuRow = document.querySelector("body > sc-app-root > sc-service-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-body > div:nth-child(3)")

    // Check if the button already exists
    if (!document.getElementById('recurring-booking-end-date') && serviceBookingMenuRow) {
        const endDateDiv = document.createElement('div');
        endDateDiv.id = 'recurring-booking-end-date';
        endDateDiv.className = 'col-md-6';

        const formGroupDiv = document.createElement('div');
        formGroupDiv.className = 'form-group';
        formGroupDiv.setAttribute('scvalidationstyle', 'endDate');

        const label = document.createElement('label');
        label.setAttribute('for', 'input-end-date');
        label.textContent = 'Repeat End Date';

        const input = document.createElement('input');
        input.type = 'date';
        input.id = 'input-end-date';
        input.name = 'endDate';
        input.placeholder = 'Select a date';
        input.className = 'form-control ng-untouched ng-pristine ng-valid';

        formGroupDiv.appendChild(label);
        formGroupDiv.appendChild(input);
        endDateDiv.appendChild(formGroupDiv);

        if (serviceBookingMenuRow) {
            serviceBookingMenuRow.appendChild(endDateDiv);
        }
    }
}



    function main() {
        const observer = new MutationObserver(() => {
            const serviceBookingRow = document.querySelector("body > sc-app-root > sc-service-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-body > div:nth-child(3)")
            // Check if the target (modal footer) element is now loaded in the DOM
            if (serviceBookingRow) {
                // Wait for 100ms
                setTimeout(() => {
                    addRepeatIntervalMenu();
                    addIntervalStopDate();
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
