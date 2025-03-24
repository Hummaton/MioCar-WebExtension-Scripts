// ==UserScript==
// @name         Export License Data
// @namespace    http://tampermonkey.net/
// @version      2025-01-25
// @description  Added as a test script to export license data and will be used as a template for helping with autofilling MVR Checker form
// @author       You
// @match        https://admin.share.car/communities/*/customers/members*
// @match        <FILL IN URL HERE>
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const MVRCHECKURL = "FILL IN URL HERE";

    // For now we need to fill in the username and password for the MVR Checker. But in the future we can use a secure way to pull these credentials from a server
    const USERNAME = "FILL IN USERNAME HERE";
    const PASSWORD = "FILL IN PASSWORD HERE";


    function openMVRCheckWindow(memberInfo) {
        // Convert object to base64    
        
        // CURRENT SOLUTION: SUBJECT TO CHANGE
        const base64 = btoa(JSON.stringify(memberInfo));
        const targetURL = `${MVRCHECKURL}#data=${base64}`;

        window.open(targetURL, "_blank");
    }

    // Function to format user data into a CSV file
    function extractInfo() {

        // Helper function to safely extract text content from a selector
        function getText(selector, defaultValue = "N/A") {
            const element = document.querySelector(selector);
            return element ? element.innerText.trim() : defaultValue;
        }

        // Gather user data
        const fullName = getText("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(1) > div:nth-child(1) > div > span");
        const dob = getText("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(2) > div.col-md-4 > div > sc-date-display > span");
        const licenseNumber = getText("#drivingLicenceSection > sc-driving-licence-summary > div > div:nth-child(1) > div:nth-child(2)");
        const state = getText("#drivingLicenceSection > sc-driving-licence-summary > div > div:nth-child(2) > div:nth-child(6)");
        // var userEmail = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(1) > div:nth-child(2) > div > span > a");
        // var userPhone = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(1) > div:nth-child(3) > div > sc-telephone-link > a > span");
        // var userAddress = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(2) > div.col-md-8 > div > span > a");
        
        ///TODO: THIS NEEDS TO CLARIFIED WITH MIOCAR
        const resident_community = getText("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div.row.ng-star-inserted > div:nth-child(6) > div > span");

        // Split the member name into first, middle, and last names
        const nameParts = fullName.split(" ");
        const firstName = nameParts[0] || "N/A";
        const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "N/A";
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "N/A";

        // Construct member information object
        const member_info = {
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            dob: dob,
            license_number: licenseNumber,
            state: state,
            resident_community: resident_community === "--" ? "N/A" : resident_community,
            username: USERNAME,
            password: PASSWORD,
        };

        console.log("Opening new window to MVRCheck...");

        openMVRCheckWindow(member_info);
        
    }

    // Function to add the recurring service booking options
    function addButton() {
        // Select the target element where buttons will be added
        var actionRow = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > header > div > div.col-md-4 > div.page-actions");

        if (actionRow && actionRow.children.length == 1) {
            // Create CSV export button
            const mvr_button = document.createElement('button');
            mvr_button.type = 'button';
            mvr_button.className = 'p-element btn btn-link';
            mvr_button.setAttribute('ptooltip', 'Download perosnal information as CSV');
            mvr_button.innerHTML = '<i class="fa fa-download"></i> Export to MVR Checker';
            mvr_button.onclick = function(){
                extractInfo();
            }; 
            
            // Append button to the row div after the first child
            actionRow.insertBefore(mvr_button, actionRow.children[0]);
        }
    }

    // Create a MutationObserver to watch for changes in the DOM
    const observer = new MutationObserver((mutations, obs) => {
        // Check if the target (row) element is now loaded in the DOM
        if (document.querySelector('.page-actions')) {
            setTimeout(() => {
                addButton(); // Add the CSV export button
                obs.disconnect(); // Stop observing once the element is found and button is added
            }, 200);
        }
    });

    // Start observing the document for changes in the DOM
    observer.observe(document, {
        childList: true,
        subtree: true
    });

})();