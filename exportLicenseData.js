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

    function openMVRCheckWindow(memberInfo) {
        // Convert object to base64    
        
        // CURRENT SOLUTION: SUBJECT TO CHANGE
        const base64 = btoa(JSON.stringify(memberInfo));
        const targetURL = `${MVRCHECKURL}#data=${base64}`;

        window.open(targetURL, "_blank");
    }

    // Function to format user data into a CSV file
    function extractInfo(username, password) {
        console.log("Extracting user information...");
        console.log("Username: ", username);
        console.log("Password: ", password);

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
            username: username,
            password: password,
        };

        console.log("Opening new window to MVRCheck...");

        openMVRCheckWindow(member_info);
        
    }

    // Function to populate the modal with input fields
    function populateModal(modal) {
        // Create a backdrop to grey out the rest of the page
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.style.position = 'fixed';
        backdrop.style.top = '0';
        backdrop.style.left = '0';
        backdrop.style.width = '100%';
        backdrop.style.height = '100%';
        backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        backdrop.style.zIndex = '9998'; // Ensure it is below the modal
        document.body.appendChild(backdrop);

        modal.className = 'modal-dialog';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '29%';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '9999'; // Ensure it is above the backdrop

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.width = '400px';
        modalContent.style.backgroundColor = 'white';
        modalContent.style.borderRadius = '5px';
        modalContent.style.overflow = 'hidden';
        modalContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';

        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        modalHeader.style.textAlign = 'center';
        modalHeader.style.padding = '15px';
        modalHeader.style.borderBottom = '1px solid #ddd';
        modalHeader.innerHTML = `
            <h3 class="modal-title" style="margin: 0;">MVR Checker Credentials</h3>
            <a class="close-button" style="position: absolute; top: 10px; right: 15px; cursor: pointer;">
            <i aria-hidden="true" class="fa fa-times"></i>
            </a>
        `;
        modalHeader.querySelector('.close-button').onclick = () => {
            document.body.removeChild(modal);
            document.body.removeChild(backdrop); // Remove the backdrop when modal is closed
        };

        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        modalBody.style.padding = '20px';
        modalBody.innerHTML = `
            <div class="form-group" style="margin-bottom: 15px;">
            <label for="mvr-username" style="display: block; margin-bottom: 5px;">Username</label>
            <input id="mvr-username" type="text" class="form-control" placeholder="Enter username" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
            <div class="form-group">
            <label for="mvr-password" style="display: block; margin-bottom: 5px;">Password</label>
            <input id="mvr-password" type="password" class="form-control" placeholder="Enter password" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
        `;

        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        modalFooter.style.display = 'flex';
        modalFooter.style.justifyContent = 'space-between';
        modalFooter.style.padding = '10px 20px';
        modalFooter.style.borderTop = '1px solid #ddd';
        modalFooter.innerHTML = `
            <button id="mvr-submit" type="button" class="btn btn-success" style="padding: 10px 20px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Submit</button>
            <button id="mvr-cancel" type="button" class="btn btn-danger" style="padding: 10px 20px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
        `;

        modalFooter.querySelector('#mvr-cancel').onclick = () => {
            document.body.removeChild(modal);
            document.body.removeChild(backdrop); // Remove the backdrop when modal is closed
        };

        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalFooter);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

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

            let mvr_username = sessionStorage.getItem('mvr_username');
            let mvr_password = sessionStorage.getItem('mvr_password');

            mvr_button.onclick = function(){
                // Create a popup modal for entering credentials
                const modal = document.createElement('div');
                populateModal(modal);

                const usernameInput = document.getElementById('mvr-username');
                const passwordInput = document.getElementById('mvr-password');
                const submitButton = document.getElementById('mvr-submit');

                // Pre-fill the input fields with stored credentials
                if (mvr_username) usernameInput.value = mvr_username;
                if (mvr_password) passwordInput.value = mvr_password

                submitButton.onclick = () => {
                    mvr_username = usernameInput.value.trim();
                    mvr_password = passwordInput.value.trim();

                    if (!mvr_username || !mvr_password) {
                        alert('Both username and password must be provided.');
                        return;
                    }

                    // store the credentials in session storage for future use
                    sessionStorage.setItem('mvr_username', mvr_username);
                    sessionStorage.setItem('mvr_password', mvr_password);

                    document.body.removeChild(modal);
                    document.body.removeChild(document.querySelector('.modal-backdrop')); // Remove the backdrop when modal is closed
                    extractInfo(mvr_username, mvr_password);
                };


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