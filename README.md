# MioCar Web Extension Scripts

This repository contains a collection of user scripts intended for use with Tampermonkey or Greasemonkey. Each script automates various tasks on the [share.car](https://admin.share.car) administrative portal or on related services such as MVRCheck.

The scripts were developed during the NCST Undergraduate Fellowship program and UC Davis EcoCAR and come with utilities to standardize network calls and date conversions. The repository also includes research documents and testing code.

## Repository Layout

```
/
├── utilities.js                # Shared helper functions
├── src/                        # Individual user scripts
│   ├── deleteMemberBookings.user.js
│   ├── exportLicenseData.user.js
│   ├── mvrChecker.user.js
│   ├── recurringBookingBackend.user.js
│   ├── recurringBookingFrontend.user.js
│   ├── reportGeneration.user.js
│   └── signupDateDisplay.user.js
├── test/
│   └── calculation_testing.js   # Manual unit tests for duration calculation
├── networkActivityAnalysis.ipynb # Jupyter notebook exploring network traffic
├── HarjotGill_NCST_UGFellow_Presentation_2024.pdf
└── NCST Ugrad Fellow Report 2024 - Harjot Gill.pdf
```

## Prerequisites

These scripts are meant to run inside the Tampermonkey browser extension. Install Tampermonkey (or another compatible user script manager) in your browser of choice before proceeding.

Some scripts rely on API keys and other runtime configuration stored in the browser's `localStorage`. Placeholder constants such as `TARGET_URL` and `LOGGING_API_URL` must be filled in with production values. Certain scripts also expect an OAuth token stored under the `oauth` key.

## Installing a Script

1. Open Tampermonkey and choose **Create a new script**.
2. Copy the contents of the desired `*.user.js` file from the `src` directory.
3. Paste the script into the editor and save.
4. Ensure the `@match` patterns in the header match your deployment URLs.
5. Refresh the target web page so Tampermonkey can inject the script.

Alternatively, you can use the `@updateURL` and `@downloadURL` fields to install directly from a hosted version of the script.

## Utilities

`utilities.js` provides helper functions that other scripts use. When loaded in Tampermonkey, the file attaches the following methods to the global `window` object:

- `getBrowserStorageValue(key)` – Retrieve and parse values from `localStorage`.
- `convertDatetimeToString(date)` – Convert a JavaScript `Date` to `YYYY-MM-DD HH:MM:SS` format.
- `(To be filled: Logging)` – 
- `getPostHeader(referer)` – Construct standard headers for authenticated POST requests.

Load `utilities.js` as an `@require` in other scripts to avoid code duplication.

## Script Overview

### deleteMemberBookings.user.js
Mass‑delete multiple bookings on a vehicle page. Adds checkboxes to the booking table, provides a progress bar, and issues POST requests to cancel each booking. Configure the API target and CloudWatch logging endpoints at the top of the file.

### exportLicenseData.user.js
Extracts member details (name, DOB, license information, etc.) from a member profile and opens a new window to MVRCheck with the data encoded in the URL hash. Includes a modal dialog for entering MVRCheck credentials, which are stored in `sessionStorage`.

### mvrChecker.user.js
Runs on the MVRCheck site. Reads the encoded member info from the URL, automates the login process, fills out the order form, and steps through the workflow across several pages. The script uses `sessionStorage` to maintain state between page transitions.

### recurringBookingFrontend.user.js
Enhances the ShareCar service booking modal by adding a **Repeat Interval** dropdown and **Repeat End Date** picker. Uses a MutationObserver to inject these fields whenever the modal is opened.

### recurringBookingBackend.user.js
Implements the logic behind recurring bookings. Validates form inputs, checks availability for each interval, handles error conditions (rate limiting, invalid token, etc.), and ultimately creates bookings through the ShareCar API. Includes detailed status messages and a progress bar during multi-step operations.

### reportGeneration.user.js
Intercepts the booking reports API call on the Reports page and offers a “Generate Report” button. When clicked, it formats the retrieved data and downloads an Excel spreadsheet using the `xlsx` library. The script logs metrics such as processing time and number of bookings processed.

### signupDateDisplay.user.js
Adds a “Signup Date” column to the members table. It parses the member data returned from the API, formats the creation date, and updates the table body. Arrow icons allow sorting the table by signup date in ascending or descending order.

## Testing

The `test/calculation_testing.js` file contains a self‑executing function that validates the quarter-hour rounding logic used for booking duration calculations. It runs a series of test cases and prints results to the browser console. This file is not automatically executed by any test runner; you must load it in the browser console or within Tampermonkey if you wish to verify the calculations.

## Development Notes

- Scripts make heavy use of DOM selectors targeting the ShareCar admin interface. Updates to the site may require adjusting these selectors.
- Some scripts rely on third-party libraries through `@require` (e.g., `xlsx.full.min.js`). Ensure your browser can load these URLs.

## Acknowledgements

The user scripts were written as part of research conducted with the National Center for Sustainable Transportation at UC Davis. See the accompanying PDF reports for context and project results.

