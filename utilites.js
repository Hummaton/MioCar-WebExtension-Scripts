// ==UserScript==
// @name         Utilities
// @namespace    http://tampermonkey.net/
// @version      2025-01-07
// @description  try to take over the world!
// @author       You
// @match        https://admin.share.car*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=share.car
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
      // Example utility function
    window.myUtilities = {
        greet: function(name) {
            return `Hello, ${name}!`;
        },
        add: function(a, b) {
            return a + b;
        }
    };

})();