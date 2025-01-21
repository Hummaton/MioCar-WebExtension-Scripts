// ==UserScript==
// @name         Test API Call Script
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  A standalone script for making API POST requests with dynamic key retrieval
// @author       Your Name
// @match        https://admin.share.car/*
// @require      https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/backend_testing/utilities.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    console.log('API Call Script Loaded');

    // Function to make a POST request
    async function makePostRequest(apiKey, url, payload) {
        console.log('makePostRequest called with:', { apiKey, url, payload });

        if (!apiKey) {
            console.error('API key not provided. Aborting request.');
            return;
        }

        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'Referer': 'https://admin.share.car/',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"'
        };

        try {
            console.log('Attempting to send POST request...');
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });

            console.log('Status Code:', response.status);

            const contentType = response.headers.get('content-type');
            console.log('Response Content-Type:', contentType);

            if (contentType && contentType.includes('application/json')) {
                const responseBody = await response.json();
                console.log('Response Body:', JSON.stringify(responseBody, null, 4));
            } else {
                const responseText = await response.text();
                console.log('Response Text:', responseText);
            }
        } catch (error) {
            console.error('Error making POST request:', error);
        }
    }

    // Main logic
    (async () => {
        console.log('Starting main logic...');

        try {
            console.log('Attempting to retrieve API key...');
            const apiKey = retrieveAccessToken(); // Retrieve the API key dynamically

            if (!apiKey) {
                console.error('Failed to retrieve API key. Aborting API call.');
                return;
            }

            console.log('API key retrieved:', apiKey);

            const url = 'https://api.share.car/v2/bookings'; // Replace with your API endpoint
            console.log('API endpoint set:', url);

            const payload = {
                "pickUpDatetime": "2026-01-01 01:00:00",
                "dropOffDatetime": "2026-01-01 04:00:00",
                "type": "service",
                "vehicle": 12523,
                "purpose": "Clean",
                "dry-run": true,
                "community": "671"
            };
            console.log('Payload prepared:', payload);

            await makePostRequest(apiKey, url, payload);
            console.log('POST request completed.');
        } catch (error) {
            console.error('Error in main logic:', error);
        }
    })();
})();
