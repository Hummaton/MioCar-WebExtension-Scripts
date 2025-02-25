// ==UserScript==
// @name         Recurring Service Booking
// @namespace    http://tampermonkey.net/
// @version      2025-01-25
// @description  Add recurring booking button
// @match        https://admin.share.car/communities/*/fleet/vehicles/*
// @grant        none
// @require      https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/main/utilities.js
// @updateURL    https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/serviceBookingRepeat.js
// @downloadURL  https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/serviceBookingRepeat.js
// ==/UserScript==
(function () {
    'use strict';

    function addRepeatIntervalMenu() {
        const serviceBookingMenuRow = document.querySelector(
            "body > sc-app-root > sc-service-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-body > div:nth-child(3)"
        );

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
            options.forEach((optionText) => {
                const option = document.createElement('option');
                option.textContent = optionText;
                option.value = optionText.toLowerCase().replace(/ /g, '-');
                select.appendChild(option);
            });

            select.appendChild(optionDefault);
            selectDiv.appendChild(select);

            recurringBookingDiv.appendChild(label);
            recurringBookingDiv.appendChild(selectDiv);

            serviceBookingMenuRow.appendChild(recurringBookingDiv);
        }
    }

    function addIntervalStopDate() {
        const serviceBookingMenuRow = document.querySelector(
            "body > sc-app-root > sc-service-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-body > div:nth-child(3)"
        );

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

            serviceBookingMenuRow.appendChild(endDateDiv);
        }
    }

    function main() {
        const targetNode = document.body;

        // Fallback: Retry mechanism using setInterval
        let retryCount = 0;
        const maxRetries = 10; // Limit retries to avoid infinite loops

        const interval = setInterval(() => {
            const serviceBookingRow = document.querySelector(
                "body > sc-app-root > sc-service-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-body > div:nth-child(3)"
            );

            if (serviceBookingRow) {
                console.log('Service booking row detected (fallback).');
                addRepeatIntervalMenu();
                addIntervalStopDate();
                clearInterval(interval); // Stop the retry mechanism
            } else if (retryCount >= maxRetries) {
                console.warn('Max retries reached. Unable to detect service booking row.');
                clearInterval(interval);
            }

            retryCount++;
        }, 500); // Retry every 500ms

        // MutationObserver for dynamic changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(() => {
                const serviceBookingRow = document.querySelector(
                    "body > sc-app-root > sc-service-booking-modal > div.modal.note-modal.fade.in > div > div > form > div.modal-body > div:nth-child(3)"
                );

                if (serviceBookingRow) {
                    console.log('Service booking row detected (observer).');
                    addRepeatIntervalMenu();
                    addIntervalStopDate();
                }
            });
        });

        // Start observing the DOM
        observer.observe(targetNode, {
            childList: true,
            subtree: true,
        });

        // Handle modal close events for reinitialization
        document.addEventListener('click', (event) => {
            if (event.target.closest('.close-button')) {
                console.log('Modal closed. Disconnecting observer.');
                observer.disconnect();
                setTimeout(main, 200); // Reinitialize after a brief delay
            }
        });
    }

    // Run the main function
    main();
})();