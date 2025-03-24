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

    const currentUrl = window.location.href;
    const ORDERFORMURL = "Fill in URL HERE";
    const INPUTFORMURL = "Fill in URL HERE";

    const hash = window.location.hash;

    if (hash.startsWith("#data=")) {
        try {
            const encoded = hash.replace("#data=", "");
            const json = atob(encoded);
            const data = JSON.parse(json);

            // Save form info to sessionStorage
            const mvr_form_input = {
                first_name: data.first_name,
                middle_name: data.middle_name,
                last_name: data.last_name,
                dob: data.dob,
                license_number: data.license_number,
                state: data.state,
                resident_community: data.resident_community,
            };

            var credentials = {
                username: data.username,
                password: data.password
            };

            var script_state = "init";
            sessionStorage.setItem("script_state", script_state);

            sessionStorage.setItem("mvr_form_input", JSON.stringify(mvr_form_input));
            console.log("[MVRCheck] Decoded user data and saved to session storage:", data);

        } catch (err) { 
            console.error("Failed to decode base64 from URL:", err);
        }
    }

    console.log("[MVRCheck] Current URL:", currentUrl);

    // -------- LOGIN PAGE --------
    if (currentUrl.includes("/login")) {
            // Login
            const usernameField = document.querySelector("#l-name");
            const passwordField = document.querySelector("#l-pass");
            const loginButton = document.querySelector("#l-btn");

            // We do not want to automate this page if there is no session state data. When the mvr export button is clicked, the session state is set to "init"
            // If we are strolling regularly, we do not want to intervene so we check for the session state
            var script_state = sessionStorage.getItem("script_state");

            const stored = sessionStorage.getItem("mvr_form_input");
            if (!stored) return;

            if (usernameField && passwordField && loginButton) {
                usernameField.value = credentials.username;
                passwordField.value = credentials.password;

                console.log("[MVRCheck] Logging in...");
                // Clear the hash from the URL
                window.location.hash = "";
                history.replaceState(null, "", window.location.pathname);

                loginButton.click();

                // TODO: HANDLE LOGIN ERROR
            }        
    }

    // -------- ORDER PAGE --------
    else if (currentUrl.includes("is/app")) {
        console.log("[MVRCheck] On dashboard page.");

        const stored = sessionStorage.getItem("mvr_form_input");
        if (!stored) return;

        try {
            //Navigate to the order page
            sessionStorage.setItem("script_state", "order form");
            console.log("[MVRCheck] Redirecting to order form...");
            window.location.href = ORDERFORMURL;
                        
        } catch (err) {
            console.error("Failed to parse stored data:", err);
        }
    }

    // -------- ORDER FORM PAGE --------  TODO: 
    else if (currentUrl.includes("order/new.taz") && sessionStorage.getItem("script_state") === "order form") {
        console.log("[MVRCheck] On order form page.");

        const stored = sessionStorage.getItem("mvr_form_input");
        if (!stored) {
            console.error("[MVRCheck] No stored data found. Error!.");
            return;
        }

        try {
            console.log("[MVRCheck] Filling MVR Driving History input...");
            document.querySelector("#CRD_INSTANT_DRIVING").click();
            document.querySelector("#order-form > div.row > div.col-sm-6.text-right > div > button").click();
            sessionStorage.setItem("script_state", "order form submitted");

        } catch (err) {
            console.error("Failed to fill form:", err);
        }
    }

    // -------- INPUT FORM PAGE MEMBER INPUT PART 1--------
    else if (currentUrl.includes("orderwizard") && sessionStorage.getItem("script_state") === "order form submitted") {
        console.log("[MVRCheck] On input form page.");

        const stored = sessionStorage.getItem("mvr_form_input");
        if (!stored) {
            console.error("[MVRCheck] No stored data found. Error!.");
            return;
        }

        try {
            const mvr_form_input = JSON.parse(stored);
            console.log("[MVRCheck] Filling MVR form input...");

            // Fill in the form
            if (mvr_form_input.resident_community !== "N/A") {
                document.querySelector("#order\\.reference").value = mvr_form_input.resident_community;
            }
            
            if (mvr_form_input.middle_name !== "N/A") {
                document.querySelector("#applicant\\.middleName").value = mvr_form_input.middle_name;
            }

            document.querySelector("#applicant\\.lastName").value = mvr_form_input.last_name;
            document.querySelector("#applicant\\.firstName").value = mvr_form_input.first_name;
            document.querySelector("#order-form > div:nth-child(5) > div:nth-child(1) > div.col-xs-12.col-sm-12.col-md-3 > div > div:nth-child(2) > input").value = mvr_form_input.dob;

            sessionStorage.setItem("script_state", "input form part 1 filled");

            // Submit the form
            document.querySelector("#applicantForm > div.row > div.col-sm-6.text-right > div > button").click();

        } catch (err) {
            console.error("Failed to fill form:", err);
        }
    }

})();
