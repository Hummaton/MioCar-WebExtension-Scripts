// ==UserScript==
// @name         API POST Request with Tampermonkey
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Make a POST request with dynamic API key
// @author       Your Name
// @match        https://admin.share.car/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to retrieve the access token from a specific key
    function retrieveAccessToken() {
        const key = 'oauth'; // Specify the key containing the token

        try {
            const value = localStorage.getItem(key);

            if (value) {
                const parsedValue = JSON.parse(value);
                if (parsedValue.access_token) {
                    return parsedValue.access_token;
                } else {
                    console.warn('Access token not found in the specified key.');
                }
            } else {
                console.warn('Specified key not found in localStorage.');
            }
        } catch (error) {
            console.error(`Error parsing the key: ${key}`, error);
        }

        return null; // Return null if no access token is found
    }

    
})();// ==UserScript==
// @name         API POST Request with Tampermonkey
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Make a POST request with dynamic API key
// @author       Your Name
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to retrieve the access token from a specific key
    function retrieveAccessToken() {
        const key = 'oauth'; // Specify the key containing the token

        try {
            const value = localStorage.getItem(key);

            if (value) {
                const parsedValue = JSON.parse(value);
                if (parsedValue.access_token) {
                    return parsedValue.access_token;
                } else {
                    console.warn('Access token not found in the specified key.');
                }
            } else {
                console.warn('Specified key not found in localStorage.');
            }
        } catch (error) {
            console.error(`Error parsing the key: ${key}`, error);
        }

        return null; // Return null if no access token is found
    }

    
})();