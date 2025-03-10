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

    function getPostHeader(referer) {
        const apiKey = getBrowserStorageValue('oauth')?.access_token;
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Referer': referer,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"'
        };

        return headers;
    }

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

    /* Example usage:
    logSuccessToAWS({
        LOGGING_API_URL: URL,
        status: "SUCCESS",
        message: "Successful booking",
        api_request_param: validbooking[2]
    });  
           ^ You don’t need to specify null for missing values */
           function logMetricToAWS({ LOGGING_API_URL, level, message, feature, time_saved = null, api_request_param = null, api_response_param = null, additional = {} }) {
            const timestamp = new Date().toISOString();
        
            // Merge all fields into additional 
            additional = { 
                ...(time_saved !== null && { time_saved }), 
                ...(api_request_param !== null && { apiRequest: api_request_param }), 
                ...(api_response_param !== null && { apiResponse: api_response_param }),
                ...additional // Ensure custom fields are included
            };
        
            // Prepare payload
            const payload = {
                timestamp,
                level,  // Ensure level is included
                feature,
                message,
                ...(Object.keys(additional).length > 0 && { details: additional }) // Additional parameters if present
            };

            // Send log to AWS
            fetch(LOGGING_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errData => {
                        throw new Error(`HTTP ${response.status}: ${JSON.stringify(errData)}`);
                    });
                }
                return response.json();
            })
            .then(data => console.log("Metric logged successfully:", data))
            .catch(error => {
                console.error("Metric logging failed:", error);
            });
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
    if (!window.logMetricToAWS) {
        Object.defineProperty(window, 'logMetricToAWS', {
            value: logMetricToAWS,
            writable: false, // Prevent overwriting
            configurable: false, // Prevent redefinition
        });
        console.log('logMetricToAWS function is now globally available.');
    } else {
        console.warn('logMetricToAWS is already defined and will not be overwritten.');
    }

    // Make the getPostHeader function available globally but protect against overwriting
    if (!window.getPostHeader) {
        Object.defineProperty(window, 'getPostHeader', {
            value: getPostHeader,
            writable: false, // Prevent overwriting
            configurable: false, // Prevent redefinition
        });
        console.log('getPostHeader function is now globally available.');
    } else {
        console.warn('getPostHeader is already defined and will not be overwritten.');
    }
    
})();
