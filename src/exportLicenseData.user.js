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

    // ===================================================================
    // CONFIGURATION & GLOBAL STATE
    // ===================================================================
    
    // Session key for credential encryption - shared secret for AES operations
    const SESSION_KEY = 'mvr_secure_key';
    
    // Cached encryption key to avoid regenerating on each operation
    let cachedKey = null;

    // ===================================================================
    // CRYPTOGRAPHIC UTILITIES - AES-256-GCM Implementation
    // ===================================================================
    
    /**
     * Converts an ArrayBuffer to a Base64 string for safe storage/transmission
     * @param {ArrayBuffer} buffer - The buffer to convert
     * @returns {string} Base64 encoded string
     */
    function arrayBufferToBase64(buffer) {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)));
    }

    /**
     * Converts a Base64 string back to an ArrayBuffer
     * @param {string} base64 - The Base64 string to convert
     * @returns {ArrayBuffer} The decoded buffer
     */
    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    /**
     * Generates or retrieves cached AES-256-GCM encryption key
     * Uses SHA-256 hash of session key to create proper 256-bit key
     * @returns {Promise<CryptoKey>} The AES encryption key
     */
    async function getKey() {
        if (cachedKey) return cachedKey;

        // Hash the session key to create a proper 256-bit key for AES-256
        const enc = new TextEncoder().encode(SESSION_KEY);
        const hash = await crypto.subtle.digest('SHA-256', enc);
        cachedKey = await crypto.subtle.importKey(
            'raw',
            hash,
            'AES-GCM',
            false,
            ['encrypt', 'decrypt']
        );
        return cachedKey;
    }

    /**
     * Encrypts text using AES-256-GCM with random IV
     * Format: base64(IV):base64(ciphertext)
     * @param {string} text - Plain text to encrypt
     * @returns {Promise<string>} Encrypted text in IV:cipher format
     */
    async function encryptText(text) {
        const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
        const key = await getKey();
        const encoded = new TextEncoder().encode(text);
        const cipher = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, key, encoded);
        return arrayBufferToBase64(iv) + ':' + arrayBufferToBase64(cipher);
    }

    /**
     * Decrypts text encrypted with encryptText()
     * @param {string} data - Encrypted data in IV:cipher format
     * @returns {Promise<string>} Decrypted plain text, empty string on error
     */
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
    
    // ===================================================================
    // CROSS-WINDOW COMMUNICATION
    // ===================================================================
    
    // Target MVR website URL - must match @match directive in mvrChecker.user.js
    const MVRCHECKURL = "https://mvrcheck.instascreen.net/is/app";

    /**
     * Opens MVR website in new window and transmits member data securely
     * Uses handshake protocol to ensure receiving script is ready
     * @param {Object} memberInfo - Member data object to transmit
     */
    function openMVRCheckWindow(memberInfo) {
        const newWindow = window.open(MVRCHECKURL, "_blank");
        
        // Handshake handler - waits for 'READY' signal from MVR script
        function handleReady(event) {
            // Validate origin and source window for security
            if (event.source === newWindow && event.data === 'READY') {
                // Send member data to MVR script with proper origin validation
                newWindow.postMessage({ 
                    type: 'DATA', 
                    payload: memberInfo 
                }, 'https://mvrcheck.instascreen.net');
                window.removeEventListener('message', handleReady);
            }
        }
        window.addEventListener('message', handleReady);
    }
    
    // ===================================================================
    // DOM UTILITIES - Safe Element Selection
    // ===================================================================
    
    /**
     * Safely queries DOM elements with error handling
     * Prevents script crashes from missing elements
     * @param {string} selector - CSS selector string
     * @param {Element} context - Search context (default: document)
     * @returns {Element|null} Found element or null
     */
    function safeQuerySelector(selector, context = document) {
        try {
            const element = context.querySelector(selector);
            if (!element) {
                console.warn(`Element not found: ${selector}`);
            }
            return element;
        } catch (error) {
            console.error(`Error selecting element: ${selector}`, error);
            return null;
        }
    }

    /**
     * Safely extracts text content from DOM elements
     * @param {string} selector - CSS selector for target element  
     * @param {string} defaultValue - Fallback value if element not found
     * @returns {string} Element text content or default value
     */
    function getText(selector, defaultValue = "N/A") {
        const element = safeQuerySelector(selector);
        return element ? element.innerText.trim() : defaultValue;
    }

    // ===================================================================
    // MEMBER DATA EXTRACTION - ShareCar DOM Parsing
    // ===================================================================
    
    /**
     * Extracts member information from ShareCar member detail page
     * Parses DOM elements to gather license and personal data
     * @param {string} username - MVR website username for automation
     * @param {string} password - MVR website password for automation
     */
    function extractInfo(username, password) {
        console.log("Extracting user information...");
        console.log("Username: ", username);

        // ---------------------------------------------------------------
        // DOM Element Extraction - WARNING: Brittle CSS Selectors
        // ---------------------------------------------------------------
        // These selectors target specific ShareCar Angular components
        // Update if ShareCar changes their DOM structure or CSS classes
        
        // Personal information from sc-personal-info-summary component
        const fullName = getText("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(1) > div:nth-child(1) > div > span");
        const dob = getText("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(2) > div.col-md-4 > div > sc-date-display > span");
        
        // License information from sc-driving-licence-summary component
        const licenseNumber = getText("#drivingLicenceSection > sc-driving-licence-summary > div > div:nth-child(1) > div:nth-child(2)");
        const state = getText("#drivingLicenceSection > sc-driving-licence-summary > div > div:nth-child(2) > div:nth-child(6)");
        
        // Commented out - additional data points available but not currently used
        // const userEmail = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(1) > div:nth-child(2) > div > span > a");
        // const userPhone = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(1) > div:nth-child(3) > div > sc-telephone-link > a > span");
        // var userAddress = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div:nth-child(2) > div.col-md-8 > div > span > a");
        
        // Community/location information - TODO: Clarify requirement with MioCar
        const resident_community = getText("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > section > sc-personal-info-summary > div.row.ng-star-inserted > div:nth-child(6) > div > span");

        // ---------------------------------------------------------------
        // Name Parsing Algorithm
        // ---------------------------------------------------------------
        // Splits full name into components for MVR form requirements
        // Logic: First word = first name, last word = last name, middle = everything else
        const nameParts = fullName.split(" ");
        const firstName = nameParts[0] || "N/A";
        const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : "N/A";
        const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : "N/A";

        // ---------------------------------------------------------------
        // Member Information Object Construction
        // ---------------------------------------------------------------
        // Structure must match expectations in mvrChecker.user.js
        const member_info = {
            first_name: firstName,
            middle_name: middleName,
            last_name: lastName,
            dob: dob,
            license_number: licenseNumber,
            state: state,
            resident_community: resident_community === "--" ? "N/A" : resident_community,
            username: username,  // MVR login credentials
            password: password,  // MVR login credentials
        };

        console.log("Opening new window to MVRCheck...");
        
        // Initiate cross-window communication with MVR automation script
        openMVRCheckWindow(member_info);
    }

    // ===================================================================
    // MODAL UI COMPONENTS - Credential Input Interface
    // ===================================================================
    
    /**
     * Creates and populates credential input modal
     * Provides user interface for entering/confirming MVR login credentials
     * @param {Element} modal - Empty modal element to populate
     */
    function populateModal(modal) {
        // ---------------------------------------------------------------
        // Modal Backdrop - Page Overlay
        // ---------------------------------------------------------------
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.style.position = 'fixed';
        backdrop.style.top = '0';
        backdrop.style.left = '0';
        backdrop.style.width = '100%';
        backdrop.style.height = '100%';
        backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        backdrop.style.zIndex = '9998'; // Below modal but above page content
        document.body.appendChild(backdrop);

        // ---------------------------------------------------------------
        // Modal Container - Centered Dialog Box
        // ---------------------------------------------------------------
        modal.className = 'modal-dialog';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)'; // Perfect centering
        modal.style.width = '90%';
        modal.style.maxWidth = '400px';
        modal.style.maxHeight = '90vh';
        modal.style.display = 'flex';
        modal.style.flexDirection = 'column';
        modal.style.zIndex = '9999'; // Above backdrop

        // ---------------------------------------------------------------
        // Modal Content Container
        // ---------------------------------------------------------------
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.width = '100%';
        modalContent.style.backgroundColor = 'white';
        modalContent.style.borderRadius = '5px';
        modalContent.style.overflow = 'auto';
        modalContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        modalContent.style.display = 'flex';
        modalContent.style.flexDirection = 'column';

        // ---------------------------------------------------------------
        // Modal Header - Title and Close Button
        // ---------------------------------------------------------------
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        modalHeader.style.textAlign = 'center';
        modalHeader.style.padding = '15px';
        modalHeader.style.borderBottom = '1px solid #ddd';
        modalHeader.style.position = 'sticky'; // Stays visible when scrolling
        modalHeader.style.top = '0';
        modalHeader.style.backgroundColor = 'white';
        modalHeader.innerHTML = `
            <h3 class="modal-title" style="margin: 0;">MVR Checker Credentials</h3>
            <a class="close-button" style="position: absolute; top: 10px; right: 15px; cursor: pointer;">
            <i aria-hidden="true" class="fa fa-times"></i>
            </a>
        `;
        
        // Close button event handler - cleanup modal and backdrop
        modalHeader.querySelector('.close-button').onclick = () => {
            document.body.removeChild(modal);
            document.body.removeChild(backdrop);
        };

        // ---------------------------------------------------------------
        // Modal Body - Form Input Fields
        // ---------------------------------------------------------------
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

        // ---------------------------------------------------------------
        // Modal Footer - Action Buttons
        // ---------------------------------------------------------------
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        modalFooter.style.display = 'flex';
        modalFooter.style.justifyContent = 'space-between';
        modalFooter.style.padding = '10px 20px';
        modalFooter.style.borderTop = '1px solid #ddd';
        modalFooter.style.position = 'sticky'; // Stays visible when scrolling
        modalFooter.style.bottom = '0';
        modalFooter.style.backgroundColor = 'white';
        modalFooter.innerHTML = `
            <button id="mvr-submit" type="button" class="btn btn-success" style="padding: 10px 20px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Submit</button>
            <button id="mvr-cancel" type="button" class="btn btn-danger" style="padding: 10px 20px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
        `;

        // Cancel button event handler - same as close button
        modalFooter.querySelector('#mvr-cancel').onclick = () => {
            document.body.removeChild(modal);
            document.body.removeChild(backdrop);
        };

        // Assemble modal components
        modalContent.appendChild(modalHeader);
        modalContent.appendChild(modalBody);
        modalContent.appendChild(modalFooter);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    // ===================================================================
    // MAIN INTERFACE - Export Button Integration
    // ===================================================================
    
    /**
     * Adds "Export to MVR Checker" button to ShareCar member page
     * Integrates with existing page actions and handles credential management
     */
    async function addButton() {
        // ---------------------------------------------------------------
        // Target Element Selection - ShareCar Page Actions Area
        // ---------------------------------------------------------------
        // Targets the specific .page-actions div in ShareCar's Angular structure
        // WARNING: This selector is brittle and may break with UI updates
        var actionRow = document.querySelector("body > sc-app-root > sc-app-root > div:nth-child(2) > section > div > div > div:nth-child(1) > main > ng-component > form > div > section:nth-child(1) > header > div > div.col-md-4 > div.page-actions");

        // Only add button if target exists and has exactly one existing child
        // Prevents duplicate button creation
        if (actionRow && actionRow.children.length == 1) {
            // ---------------------------------------------------------------
            // Button Creation and Styling
            // ---------------------------------------------------------------
            const mvr_button = document.createElement('button');
            mvr_button.type = 'button';
            mvr_button.className = 'p-element btn btn-link'; // Match ShareCar's button styles
            mvr_button.setAttribute('ptooltip', 'Download personal information as CSV'); // Tooltip text
            mvr_button.innerHTML = '<i class="fa fa-download"></i> Export to MVR Checker';

            // ---------------------------------------------------------------
            // Credential Retrieval and Decryption
            // ---------------------------------------------------------------
            // Attempt to load previously stored credentials from session storage
            let mvr_username = sessionStorage.getItem('mvr_username');
            let mvr_password = sessionStorage.getItem('mvr_password');

            // Decrypt credentials if they exist
            if (mvr_username) mvr_username = await decryptText(mvr_username);
            if (mvr_password) mvr_password = await decryptText(mvr_password);

            // ---------------------------------------------------------------
            // Button Click Handler - Main Workflow Entry Point
            // ---------------------------------------------------------------
            mvr_button.onclick = function(){
                // Create and display credential input modal
                const modal = document.createElement('div');
                populateModal(modal);

                // Get references to modal form elements
                const usernameInput = document.getElementById('mvr-username');
                const passwordInput = document.getElementById('mvr-password');
                const submitButton = document.getElementById('mvr-submit');

                // Pre-populate form fields with decrypted stored credentials
                if (mvr_username) usernameInput.value = mvr_username;
                if (mvr_password) passwordInput.value = mvr_password;

                // ---------------------------------------------------------------
                // Submit Button Handler - Credential Processing
                // ---------------------------------------------------------------
                submitButton.onclick = async () => {
                    // Extract and validate user input
                    mvr_username = usernameInput.value.trim();
                    mvr_password = passwordInput.value.trim();

                    if (!mvr_username || !mvr_password) {
                        alert('Both username and password must be provided.');
                        return;
                    }

                    // Encrypt and store credentials for future use
                    const encUser = await encryptText(mvr_username);
                    const encPass = await encryptText(mvr_password);
                    sessionStorage.setItem('mvr_username', encUser);
                    sessionStorage.setItem('mvr_password', encPass);

                    // Clean up modal UI
                    document.body.removeChild(modal);
                    document.body.removeChild(document.querySelector('.modal-backdrop'));
                    
                    // Begin member data extraction and MVR automation
                    extractInfo(mvr_username, mvr_password);
                };
            }; 
            
            // Insert button into ShareCar's page actions area
            actionRow.insertBefore(mvr_button, actionRow.children[0]);
        }
    }

    // ===================================================================
    // INITIALIZATION - DOM Ready Detection
    // ===================================================================
    
    /**
     * DOM Mutation Observer - Waits for ShareCar page to fully load
     * ShareCar uses Angular which loads content dynamically
     * This observer waits for the target elements to appear before adding our button
     */
    const observer = new MutationObserver((mutations, obs) => {
        // Check if ShareCar's page-actions element is now available
        if (document.querySelector('.page-actions')) {
            setTimeout(() => {
                addButton(); // Add our export button to the interface
                obs.disconnect(); // Stop observing once button is added
            }, 200); // Small delay to ensure full DOM stability
        }
    });

    // Start observing the document for DOM changes
    // This handles ShareCar's dynamic content loading
    observer.observe(document, {
        childList: true,  // Monitor for new child elements
        subtree: true     // Monitor entire DOM tree, not just direct children
    });

})();
