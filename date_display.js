// ==UserScript==
// @name         Signup Date Display
// @namespace    http://tampermonkey.net/
// @version      2024-09-30
// @description  try to take over the world!
// @author       You
// @match        https://admin.share.car/communities/694/customers/members*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @grant        none
// ==/UserScript==

(function() {
    'use strict';


    // Function to add the date selection buttons
    function addColumn() {
        // Select the target element where buttons will be added
        var table = document.querySelector('#membersTable');

        if (table) {
            // Create the table header element
            createTableHeader();
            createTableBody();
            editTableProperties();
        }

        function createTableHeader() {
            const tableHead = document.createElement('th');
            tableHead.scope = 'col';
            tableHead.width = '10%';

            // Create text node for 'Signup Date'
            const textNode = document.createTextNode('Signup Date');

            // Create the sc-collection-sort element
            const scCollectionSort = document.createElement('sc-collection-sort');
            scCollectionSort.setAttribute('column', 'signupDate');

            // Create the div for sort-options
            const sortOptionsDiv = document.createElement('div');
            sortOptionsDiv.className = 'sort-options';

            // Create span for ascending sort
            const sortAscSpan = document.createElement('span');
            sortAscSpan.className = 'sort-asc active';
            const ascIcon = document.createElement('i');
            ascIcon.className = 'fa fa-angle-up';
            ascIcon.setAttribute('aria-hidden', 'true');
            sortAscSpan.appendChild(ascIcon);

            // Create span for descending sort
            const sortDescSpan = document.createElement('span');
            sortDescSpan.className = 'sort-desc';
            const descIcon = document.createElement('i');
            descIcon.className = 'fa fa-angle-down';
            descIcon.setAttribute('aria-hidden', 'true');
            sortDescSpan.appendChild(descIcon);

            // Append the sort asc and desc to the sort-options div
            sortOptionsDiv.appendChild(sortAscSpan);
            sortOptionsDiv.appendChild(sortDescSpan);

            // Append sort-options div to sc-collection-sort
            scCollectionSort.appendChild(sortOptionsDiv);

            // Append text node and sc-collection-sort to the tableHead
            tableHead.appendChild(textNode);
            tableHead.appendChild(scCollectionSort);

            // Append tableHead to the table, e.g. to the first row of the thead
            document.querySelector('thead tr').appendChild(tableHead);
        }

        function createTableBody() {
            // Create the table data element
            const signupDate = document.createElement('td');
            signupDate.textContent = 'Sample Date';

            // Append the table data element to the table
            document.querySelector("#membersTable > tbody > tr").appendChild(signupDate);
        }

        function editTableProperties() {
            //<tr><th scope="col" width="10%"> ID <sc-collection-sort column="id"><div class="sort-options"><span class="sort-asc active"><i aria-hidden="true" class="fa fa-angle-up"></i></span><span class="sort-desc"><i aria-hidden="true" class="fa fa-angle-down"></i></span></div></sc-collection-sort></th><th scope="col" width="15%"> First Name <sc-collection-sort column="personalInfo.firstName"><div class="sort-options"><span class="sort-asc"><i aria-hidden="true" class="fa fa-angle-up"></i></span><span class="sort-desc"><i aria-hidden="true" class="fa fa-angle-down"></i></span></div></sc-collection-sort></th><th scope="col" width="15%"> Last Name <sc-collection-sort column="personalInfo.lastName"><div class="sort-options"><span class="sort-asc"><i aria-hidden="true" class="fa fa-angle-up"></i></span><span class="sort-desc"><i aria-hidden="true" class="fa fa-angle-down"></i></span></div></sc-collection-sort></th><th scope="col" width="35%"> Email <sc-collection-sort column="email"><div class="sort-options"><span class="sort-asc"><i aria-hidden="true" class="fa fa-angle-up"></i></span><span class="sort-desc"><i aria-hidden="true" class="fa fa-angle-down"></i></span></div></sc-collection-sort></th><th scope="col" width="15%"> Phone <sc-collection-sort column="personalInfo.mobilePhoneNumber"><div class="sort-options"><span class="sort-asc"><i aria-hidden="true" class="fa fa-angle-up"></i></span><span class="sort-desc"><i aria-hidden="true" class="fa fa-angle-down"></i></span></div></sc-collection-sort></th><th scope="col" width="10%"> Status <sc-collection-sort column="role.status"><div class="sort-options"><span class="sort-asc"><i aria-hidden="true" class="fa fa-angle-up"></i></span><span class="sort-desc"><i aria-hidden="true" class="fa fa-angle-down"></i></span></div></sc-collection-sort></th><th scope="col" width="10%">Signup Date<sc-collection-sort column="signupDate"><div class="sort-options"><span class="sort-asc active"><i class="fa fa-angle-up" aria-hidden="true"></i></span><span class="sort-desc"><i class="fa fa-angle-down" aria-hidden="true"></i></span></div></sc-collection-sort></th></tr>
            //Modify the table width visuals to fit the new column
            
            const tableElements = document.querySelector("#membersTable > thead > tr").children;

            // Shorten the email column
            tableElements[3].width = "25%";
        }
    }

    // Create a MutationObserver to watch for changes in the DOM
    const observer = new MutationObserver((_, obs) => {
        // Check if the target (form) element is now loaded in the DOM
        if (document.querySelector('#membersTable')) {
            addColumn(); // Add the buttons
            obs.disconnect(); // Stop observing once the element is found and buttons are added
        }
    });

    // Start observing the document for changes in the DOM
    observer.observe(document, {
        childList: true,
        subtree: true
    });

})();

