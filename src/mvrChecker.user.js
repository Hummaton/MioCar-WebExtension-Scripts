// ==UserScript==
// @name         Receive and autofill MVRCheck form
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Listens for user info and fills login
// @match        https://mvrcheck.instascreen.net/*
// @updateURL    https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/src/mvrChecker.user.js
// @downloadURL  https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/src/mvrChecker.user.js

// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ============================================
    // CONFIGURATION & INITIALIZATION
    // ============================================
    
    const ORDERFORMURL = "https://mvrcheck.instascreen.net/order/new.taz";
    const ORIGIN = 'https://mvrcheck.instascreen.net';
    const SHARECAR_ORIGIN = 'https://admin.share.car';

    let credentials = null; // Stores MVR login credentials from ShareCar

    // ============================================
    // STATE PROCESSING UTILITIES
    // ============================================
    
    /**
     * Converts state names to standardized 2-letter abbreviations
     * Handles US states, territories, and Canadian provinces
     */
    function process_state_data(state) {
        const stateMap = {
            "Alabama": "AL",
            "Alaska": "AK",
            "Arizona": "AZ",
            "Arkansas": "AR",
            "California": "CA",
            "Colorado": "CO",
            "Connecticut": "CT",
            "Delaware": "DE",
            "District of Columbia": "DC",
            "Florida": "FL",
            "Georgia": "GA",
            "Hawaii": "HI",
            "Idaho": "ID",
            "Illinois": "IL",
            "Indiana": "IN",
            "Iowa": "IA",
            "Kansas": "KS",
            "Kentucky": "KY",
            "Louisiana": "LA",
            "Maine": "ME",
            "Maryland": "MD",
            "Massachusetts": "MA",
            "Michigan": "MI",
            "Minnesota": "MN",
            "Mississippi": "MS",
            "Missouri": "MO",
            "Montana": "MT",
            "Nebraska": "NE",
            "Nevada": "NV",
            "New Hampshire": "NH",
            "New Jersey": "NJ",
            "New Mexico": "NM",
            "New York": "NY",
            "North Carolina": "NC",
            "North Dakota": "ND",
            "Ohio": "OH",
            "Oklahoma": "OK",
            "Oregon": "OR",
            "Pennsylvania": "PA",
            "Rhode Island": "RI",
            "South Carolina": "SC",
            "South Dakota": "SD",
            "Tennessee": "TN",
            "Texas": "TX",
            "Utah": "UT",
            "Vermont": "VT",
            "Virginia": "VA",
            "Washington": "WA",
            "West Virginia": "WV",
            "Wisconsin": "WI",
            "Wyoming": "WY",
    
            // US Territories
            "UST - American Samoa": "AS",
            "UST - Fed States of Micronesia": "FM",
            "UST - Guam": "GU",
            "UST - Marshall Islands": "MH",
            "UST - Northern Mariana Islands": "MP",
            "UST - Palau": "PW",
            "UST - Puerto Rico": "PR",
            "UST - Virgin Islands": "VI",
    
            // Canadian Provinces
            "CAN - Alberta": "AB",
            "CAN - British Columbia": "BC",
            "CAN - Manitoba": "MB",
            "CAN - New Brunswick": "NB",
            "CAN - Newfoundland & Labrador": "NL",
            "CAN - Northwest Territories": "NT",
            "CAN - Nova Scotia": "NS",
            "CAN - Nunavut": "NU",
            "CAN - Ontario": "ON",
            "CAN - Prince Edward Island": "PE",
            "CAN - Quebec": "QC",
            "CAN - Saskatchewan": "SK",
            "CAN - Yukon": "YT"
        };
    
        // Normalize input - trim whitespace and convert to uppercase
        const input = (state || "").trim().toUpperCase();
    
        // Check if it's already a valid 2-letter abbreviation
        if (Object.values(stateMap).includes(input)) {
            return input;
        }
    
        // Convert from full state name to abbreviation
        const match = Object.entries(stateMap).find(([name]) => name.toUpperCase() === input);
        const result = match ? match[1] : "";
        
        return result;
    }
    
    // ============================================
    // DATA PROCESSING & COMMUNICATION
    // ============================================
    
    const currentUrl = window.location.href;
    const hash = window.location.hash;

    /**
     * Processes member data received from ShareCar and prepares it for MVR automation
     * Sets up session storage and triggers page automation
     */
    function handleData(data) {
        try {
            // Normalize state data to 2-letter abbreviation
            data.state = process_state_data(data.state);
            
            // Prepare form data structure for MVR website
            const mvr_form_input = {
                first_name: data.first_name,
                middle_name: data.middle_name,
                last_name: data.last_name,
                dob: data.dob,
                license_number: data.license_number,
                state: data.state,
                resident_community: data.resident_community,
            };

            // Store MVR login credentials separately
            credentials = {
                username: data.username,
                password: data.password
            };

            // Store data in session storage for persistence across page navigations
            sessionStorage.setItem("script_state", "init");
            sessionStorage.setItem("mvr_form_input", JSON.stringify(mvr_form_input));
            
            // Re-trigger automation now that we have data
            processCurrentPage();
            
        } catch (error) {
            console.error('Error in handleData:', error);
        }
    }

    // Handle data passed via URL hash (fallback method)
    if (hash.startsWith("#data=")) {
        try {
            const encoded = hash.replace("#data=", "");
            const json = atob(encoded);
            const data = JSON.parse(json);
            handleData(data);
        } catch (err) {
            console.error("Failed to decode base64 from URL:", err);
        }
    }

    // Set up cross-window message listener for data from ShareCar
    window.addEventListener('message', (event) => {
        // Validate origin and message structure for security
        if ((event.origin === ORIGIN || event.origin === SHARECAR_ORIGIN) && event.data && event.data.type === 'DATA') {
            handleData(event.data.payload);
        }
    });

    // Send ready signal to parent window (ShareCar)
    if (window.opener) {
        window.opener.postMessage('READY', '*');
    }

    // ============================================
    // PAGE AUTOMATION WORKFLOW
    // ============================================
    
    /**
     * Main automation controller - processes current page based on URL and state
     * Workflow: Login → Dashboard → Order Form → Personal Info → License Info
     */
    function processCurrentPage() {
        const currentUrl = window.location.href;
        
        // -------- LOGIN PAGE AUTOMATION --------
        if (currentUrl.includes("/login") || currentUrl.includes("sso/login")) {
            const scriptState = sessionStorage.getItem("script_state");
            
            // Only proceed if we have received data from ShareCar
            if (scriptState === "init") {
                const stored = sessionStorage.getItem("mvr_form_input");
                if (!stored) {
                    return;
                }

                // Find login form elements
                const usernameField = document.querySelector("#l-name");
                const passwordField = document.querySelector("#l-pass");
                const loginButton = document.querySelector("#l-btn");

                // Fill and submit login form
                if (usernameField && passwordField && loginButton && credentials) {
                    try {
                        usernameField.value = credentials.username;
                        passwordField.value = credentials.password;

                        // Clean up URL hash
                        window.location.hash = "";
                        history.replaceState(null, "", window.location.pathname);

                        loginButton.click();
                        
                    } catch (error) {
                        console.error('Error during login form filling:', error);
                    }
                }
            }
        }

        // -------- DASHBOARD PAGE - REDIRECT TO ORDER FORM --------
        else if (currentUrl.includes("is/app")) {
            const scriptState = sessionStorage.getItem("script_state");
            if (scriptState === "init") {
                const stored = sessionStorage.getItem("mvr_form_input");
                if (!stored) {
                    return;
                }

                try {
                    // Update state and navigate to order form
                    sessionStorage.setItem("script_state", "order form");
                    window.location.href = ORDERFORMURL;
                                
                } catch (err) {
                    console.error('Failed to navigate to order form:', err);
                }
            }
        }

        // -------- ORDER FORM PAGE - SELECT MVR OPTION --------
        else if (currentUrl.includes("order/new.taz")) {
            const scriptState = sessionStorage.getItem("script_state");
            if (scriptState === "order form") {
                const stored = sessionStorage.getItem("mvr_form_input");
                if (!stored) {
                    return;
                }

                try {
                    // Select "Instant Driving Record" option and continue
                    const drivingCheckbox = document.querySelector("#CRD_INSTANT_DRIVING");
                    const continueButton = document.querySelector("#order-form > div.row > div.col-sm-6.text-right > div > button");

                    if (drivingCheckbox) {
                        drivingCheckbox.click();
                    }

                    if (continueButton) {
                        continueButton.click();
                        sessionStorage.setItem("script_state", "order form submitted");
                    }

                } catch (err) {
                    console.error('Failed to fill order form:', err);
                }
            }
        }

        // -------- INPUT WIZARD - HANDLE BOTH PERSONAL AND LICENSE INFO --------
        else if (currentUrl.includes("orderwizard")) {
            const scriptState = sessionStorage.getItem("script_state");
            
            // PART 1: Personal Information Form
            if (scriptState === "order form submitted") {
                const stored = sessionStorage.getItem("mvr_form_input");
                if (!stored) {
                    return;
                }

                try {
                    const mvr_form_input = JSON.parse(stored);

                    // Find personal information form elements
                    const referenceField = document.querySelector("#order\\.reference");
                    const middleNameField = document.querySelector("#applicant\\.middleName");
                    const lastNameField = document.querySelector("#applicant\\.lastName");
                    const firstNameField = document.querySelector("#applicant\\.firstName");
                    const dobField = document.querySelector("#order-form > div:nth-child(5) > div:nth-child(1) > div.col-xs-12.col-sm-12.col-md-3 > div > div:nth-child(2) > input");
                    const submitButton = document.querySelector("#applicantForm > div.row > div.col-sm-6.text-right > div > button");

                    // Fill personal information
                    if (mvr_form_input.resident_community !== "N/A" && referenceField) {
                        referenceField.value = mvr_form_input.resident_community;
                    }
                    
                    if (mvr_form_input.middle_name !== "N/A" && middleNameField) {
                        middleNameField.value = mvr_form_input.middle_name;
                    }

                    if (lastNameField) {
                        lastNameField.value = mvr_form_input.last_name;
                    }

                    if (firstNameField) {
                        firstNameField.value = mvr_form_input.first_name;
                    }

                    if (dobField) {
                        dobField.value = mvr_form_input.dob;
                    }

                    // Update state and submit form
                    sessionStorage.setItem("script_state", "input form part 1 filled");

                    if (submitButton) {
                        submitButton.click();
                    }

                } catch (err) {
                    console.error('Failed to fill input form part 1:', err);
                }
            }
            
            // PART 2: License Information Form
            else if (scriptState === "input form part 1 filled") {
                const stored = sessionStorage.getItem("mvr_form_input");
                if (!stored) {
                    return;
                }

                try {
                    const mvr_form_input = JSON.parse(stored);

                    // Find license information form elements
                    const stateSelect = document.querySelector('select[name="searchBeans[CRD_INSTANT_DRIVING].verifications[0].state"]');
                    const licenseField = document.querySelector("#searchBeans\\[CRD_INSTANT_DRIVING\\]\\.verifications\\[0\\]\\.licenseNumber");
                    const finalSubmitButton = document.querySelector("#page-main > form > div.row > div.col-sm-6.text-right > div > button");

                    // Fill license information
                    if (stateSelect) {
                        stateSelect.value = mvr_form_input.state;

                        // Trigger change event for any dependent form logic
                        const event = new Event('change', { bubbles: true });
                        stateSelect.dispatchEvent(event);
                    }

                    if (licenseField) {
                        licenseField.value = mvr_form_input.license_number;
                    }

                    // Mark automation as complete and submit final form
                    sessionStorage.setItem("script_state", "form filling complete!");

                    if (finalSubmitButton) {
                        finalSubmitButton.click();
                    }

                } catch (err) {
                    console.error('Failed to fill input form part 2:', err);
                }
            }
        }
    }

    // ============================================
    // SCRIPT INITIALIZATION
    // ============================================
    
    // Start the automation process
    processCurrentPage();

})();
