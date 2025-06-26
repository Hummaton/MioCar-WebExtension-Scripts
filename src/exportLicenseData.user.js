// ==UserScript==
// @name         Export License Data
// @namespace    http://tampermonkey.net/
// @description  Extracts member data from sharecar application
// @version      2025-05-04
    let cachedKey = null;

        if (cachedKey) return cachedKey;

        const hash = await crypto.subtle.digest('SHA-256', enc);
        cachedKey = await crypto.subtle.importKey(
            'raw',
            hash,
            'AES-GCM',
            false,
            ['encrypt', 'decrypt']
        );
        return cachedKey;
// @match        https://mvrcheck.instascreen.net/is/app
// @updateURL    https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/src/exportLicenseData.user.js
// @downloadURL  https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/src/exportLicenseData.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const SESSION_KEY = 'mvr_secure_key';

    function arrayBufferToBase64(buffer) {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }

    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    async function getKey() {
        const enc = new TextEncoder().encode(SESSION_KEY);
        return crypto.subtle.importKey('raw', enc, 'AES-GCM', false, ['encrypt', 'decrypt']);
    }

    async function encryptText(text) {
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await getKey();
        const encoded = new TextEncoder().encode(text);
        const cipher = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, key, encoded);
        return arrayBufferToBase64(iv) + ':' + arrayBufferToBase64(cipher);
    }

    async function decryptText(data) {
        try {
            const [ivStr, cipherStr] = data.split(':');
            const iv = new Uint8Array(base64ToArrayBuffer(ivStr));
            const cipher = base64ToArrayBuffer(cipherStr);
            const key = await getKey();
            const decrypted = await crypto.subtle.decrypt({name: 'AES-GCM', iv}, key, cipher);
            return new TextDecoder().decode(decrypted);
        } catch (err) {
            console.error('Failed to decrypt credentials', err);
            return '';
        }
    }
    
    const MVRCHECKURL = "https://mvrcheck.instascreen.net/is/app"; // Updated URL

    function openMVRCheckWindow(memberInfo) {
        const newWindow = window.open(MVRCHECKURL, "_blank");
        function handleReady(event) {
            if (event.source === newWindow && event.data === 'READY') {
                newWindow.postMessage({ type: 'DATA', payload: memberInfo }, 'https://mvrcheck.instascreen.net');
                window.removeEventListener('message', handleReady);
            }
        }
        window.addEventListener('message', handleReady);
    }

    // Function to format user data into a CSV file
    function extractInfo(username, password) {
        console.log("Extracting user information...");
        console.log("Username: ", username);

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
        // const userEmail = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(1) > div:nth-child(2) > div > span > a");
        // const userPhone = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(1) > div:nth-child(3) > div > sc-telephone-link > a > span");
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
        modal.style.top = '50%'; // Center vertically
        modal.style.left = '50%'; // Center horizontally
        modal.style.transform = 'translate(-50%, -50%)'; // Center the modal
        modal.style.width = '90%';
        modal.style.maxWidth = '400px';
        modal.style.maxHeight = '90vh'; // Maximum height relative to viewport
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.zIndex = '9999';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.width = '100%';
        modalContent.style.backgroundColor = 'white';
        modalContent.style.borderRadius = '5px';
        modalContent.style.overflow = 'auto'; // Allow scrolling if content is too long
        modalContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        modalContent.style.display = 'flex';
        modalContent.style.flexDirection = 'column';

        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        modalHeader.style.textAlign = 'center';
        modalHeader.style.padding = '15px';
        modalHeader.style.borderBottom = '1px solid #ddd';
        modalHeader.style.position = 'sticky'; // Keep header visible
        modalHeader.style.top = '0';
        modalHeader.style.backgroundColor = 'white';
        modalHeader.innerHTML = `
            <h3 class="modal-title" style="margin: 0;">MVR Checker Credentials</h3>
            <a class="close-button" style="position: absolute; top: 10px; right: 15px; cursor: pointer;">
            <i aria-hidden="true" class="fa fa-times"></i>
            </a>
        `;
        modalHeader.querySelector('.close-button').onclick = () => {
            document.body.removeChild(modal);
            document.body.removeChild(backdrop);
        };

        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        modalBody.style.padding = '20px';
        modalBody.style.flexGrow = '1';
        modalBody.style.overflow = 'auto';
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
        modalFooter.style.position = 'sticky'; // Keep footer visible
        modalFooter.style.bottom = '0';
        modalFooter.style.backgroundColor = 'white';
        modalFooter.innerHTML = `
            <button id="mvr-submit" type="button" class="btn btn-success" style="padding: 10px 20px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Submit</button>
            <button id="mvr-cancel" type="button" class="btn btn-danger" style="padding: 10px 20px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
        `;

        modalFooter.querySelector('#mvr-cancel').onclick = () => {
            document.body.removeChild(modal);
            document.body.removeChild(backdrop);
        };

        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalFooter);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    // Function to add the recurring service booking options
    async function addButton() {
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

            if (mvr_username) mvr_username = await decryptText(mvr_username);
            if (mvr_password) mvr_password = await decryptText(mvr_password);

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

                submitButton.onclick = async () => {
                    mvr_username = usernameInput.value.trim();
                    mvr_password = passwordInput.value.trim();

                    if (!mvr_username || !mvr_password) {
                        alert('Both username and password must be provided.');
                        return;
                    }

                    // store the credentials in session storage for future use
                    const encUser = await encryptText(mvr_username);
                    const encPass = await encryptText(mvr_password);
                    sessionStorage.setItem('mvr_username', encUser);
                    sessionStorage.setItem('mvr_password', encPass);

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
