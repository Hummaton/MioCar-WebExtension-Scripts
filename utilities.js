// ==UserScript==
// @name         Utilities
// @namespace    http://tampermonkey.net/
// @version      2025-01-25
// @description  None
// @author       Your Name
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

    function logErrorToAWS(LOGGING_API_URL, message, api_request_param, api_response_param) {
        // Get a time stamp of the current time 
        const timestamp = convertDatetimeToString(new Date());
        fetch(LOGGING_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                timestamp: timestamp,
                level: "ERROR",
                message: message,
                api_request_param: api_request_param,
                api_response_param: api_response_param
            })
        })
        .then(response => response.json())
        .then(data => console.log("Error Metric logged successfully:", data))
        .catch(error => console.error("Error Metric logging failed:", error));
    }

    /* 'date' is the js Date object */
    function convertDatetimeToString(date) {
        if (date instanceof Date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');

            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        } else {
            console.error("Not a valid Date object");
        }
        return null;
    }

    function logSuccessToAWS(LOGGING_API_URL, message,  time_saved, api_request_param, api_response_param) {
        // Get a time stamp of the current time 
        const timestamp = convertDatetimeToString(new Date());
        fetch(LOGGING_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                timestamp: timestamp,
                level: "Success",
                message: message,
                time_saved: time_saved,
                api_request_param: api_request_param,
                api_response_param: api_response_param
            })
        })
        .then(response => response.json())
        .then(data => console.log("Metric logged successfully:", data))
        .catch(error => console.error("Metric logging failed:", error));
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
    if (!window.logErrorToAWS) {
        Object.defineProperty(window, 'logErrorToAWS', {
            value: logErrorToAWS,
            writable: false, // Prevent overwriting
            configurable: false, // Prevent redefinition
        });
        console.log('logErrorToAWS function is now globally available.');
    } else {
        console.warn('logErrorToAWS is already defined and will not be overwritten.');
    }

    // Make the convertDatetimeToString function available globally but protect against overwriting
    if (!window.convertDatetimeToString) {
        Object.defineProperty(window, 'convertDatetimeToString', {
            value: convertDatetimeToString,
            writable: false, // Prevent overwriting
            configurable: false, // Prevent redefinition
        });
        console.log('convertDatetimeToString function is now globally available.');
    } else {
        console.warn('convertDatetimeToString is already defined and will not be overwritten.');
    }

    // Make the logMetricToAWS function available globally but protect against overwriting
    if (!window.logSuccessToAWS) {
        Object.defineProperty(window, 'logSuccessToAWS', {
            value: logSuccessToAWS,
            writable: false, // Prevent overwriting
            configurable: false, // Prevent redefinition
        });
        console.log('logSuccessToAWS function is now globally available.');
    } else {
        console.warn('logSuccessToAWS is already defined and will not be overwritten.');
    }
    
})();
