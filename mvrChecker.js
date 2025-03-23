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

    function login(username, password) {
        // Fill in the login form and submit
        document.querySelector("#l-name").value = username;
        document.querySelector("#l-pass").value = password;
        // wait for 4 seconds 
        document.querySelector("#l-btn").click();
    }

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

            let username_element = document.querySelector("#l-name");
            let password_element = document.querySelector("#l-pass");

            if (username_element && password_element) {
                login(data.username, data.password);
            }

            // setTimeout(() => {
            //         console.log("[MVRCheck] Redirecting to MVRCheck order page.");
            //     }
            // }, 4000);
            
            data = null; // Clear data for security reasons

        } catch (err) {
            console.error("Failed to decode base64 from URL:", err);
        }

        // Clean up URL
        history.replaceState(null, "", window.location.pathname);
    }

})();
