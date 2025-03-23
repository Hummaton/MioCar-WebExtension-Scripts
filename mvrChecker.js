// ==UserScript==
// @name         Receive and autofill MVRCheck form
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Listens for user info and fills login
// @match        <FILL IN URL HERE>
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const hash = window.location.hash;

    if (hash.startsWith("#data=")) {
        try {
            const encoded = hash.replace("#data=", "");
            const json = atob(encoded);
            const data = JSON.parse(json);

            console.log("[MVRCheck] Decoded user data:", data);

            var mvr_form_input = {
                "first_name": data.first_name,
                "middle_name": data.middle_name,
                "last_name": data.last_name,
                "dob": data.dob,
                "license_number": data.license_number,
                "state": data.state,
                "resident_community": data.resident_community,
            }

            //TODO: Login with credentials 
            login(data.username, data.password);
            
            data = null; // Clear data for security reasons

        } catch (err) {
            console.error("Failed to decode base64 from URL:", err);
        }

        // Clean up URL
        history.replaceState(null, "", window.location.pathname);
    }

})();
