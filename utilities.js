// ==UserScript==
// @name         Utilities
// @namespace    http://tampermonkey.net/
// @version      2025-01-25
// @description  Make a POST request with dynamic API key
// @author       Your Name
// @updateURL    https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/utilities.js
// @downloadURL  https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/utilities.js
// @match        https://admin.share.car*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    console.log('Utilities script loaded');

    /**
     * Retrieves a value from the browser's localStorage and parses it as JSON.
     *
     * @param {string} key - The key of the item to retrieve from localStorage.
     * @returns {any|null} The parsed value from localStorage, or null if the key is not found or an error occurs.
     
       Example usage:
       const accessToken = getBrowserStorageValue('oauth')?.access_token;
       const activeCommunityId = getBrowserStorageValue('activeCommunityId');
    */

    function getBrowserStorageValue(key) {
        try {
            const value = localStorage.getItem(key);
            if (value) {
                const parsedValue = JSON.parse(value);
                return parsedValue;
            } else {
                console.warn(`Specified key "${key}" not found in localStorage.`);
            }
        } catch (error) {
            console.error(`Error parsing the key: ${key}`, error);
        }

        return null; // Return null if no value is found
    }


    function criticalError(error) {
        alert('Error has occurred. Check the console for more information.');
        console.error('Critical error:', error);

        //TODO: Implement an API Call to Google sheet to log the error
        
    }

    // Make the retrieveAccessToken function available globally but protect against overwriting
    if (!window.getBrowserStorageValue) {
        Object.defineProperty(window, 'getBrowserStorageValue', {
            value: getBrowserStorageValue,
            writable: false, // Prevent overwriting
            configurable: false, // Prevent redefinition
        });
        console.log('getBrowserStorageValue function is now globally available.');
    } else {
        console.warn('getBrowserStorageValue is already defined and will not be overwritten.');
    }

    // Make the criticalError function available globally but protect against overwriting
    if (!window.criticalError) {
        Object.defineProperty(window, 'criticalError', {
            value: criticalError,
            writable: false, // Prevent overwriting
            configurable: false, // Prevent redefinition
        });
        console.log('criticalError function is now globally available.');
    } else {
        console.warn('criticalError is already defined and will not be overwritten.');
    }
})();
