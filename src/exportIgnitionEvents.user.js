// ==UserScript==
// @name         exportIgnitionEvents
// @namespace    http://tampermonkey.net/
// @version      2.6.1
// @description  Adds a "This Booking" preset to export exactly the duration of the current reservation.
// @match        https://fleetcontrol.invers.com/*
// @match        https://admin.share.car/*
// @updateURL    https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/src/exportIgnitionEvents.user.js
// @downloadURL  https://raw.githubusercontent.com/Hummaton/MioCar-WebExtension-Scripts/refs/heads/main/src/exportIgnitionEvents.user.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      api.invers.com
// @connect      miocar.org
// ==/UserScript==

(function() {
    'use strict';

    const CONFIG = {
        btnId: "invers-mega-btn",
        btnStyle: {
            position: 'fixed', bottom: '20px', right: '20px', zIndex: '99999',
            padding: '15px', backgroundColor: '#007bff', color: 'white',
            border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontFamily: 'Arial, sans-serif'
        }
    };

    // --- SECURE CONFIG FETCH ---
    // Fetches sensitive API endpoints from the MioCar backend at runtime.
    // Requires the user to be logged in to miocar.org (session cookie is sent
    // automatically via withCredentials). No URLs are hardcoded in this script.

    let _cachedConfig = null;

    function fetchMioCarConfig() {
        return new Promise((resolve, reject) => {
            if (_cachedConfig) return resolve(_cachedConfig);
            GM_xmlhttpRequest({
                method: 'GET',
                url: 'https://miocar.org/api/config',
                withCredentials: true,
                onload: (res) => {
                    if (res.status === 200) {
                        try {
                            _cachedConfig = JSON.parse(res.responseText);
                            resolve(_cachedConfig);
                        } catch (e) {
                            reject('Failed to parse MioCar config.');
                        }
                    } else if (res.status === 401) {
                        reject('not_authenticated');
                    } else {
                        reject('MioCar config fetch failed with status ' + res.status);
                    }
                },
                onerror: () => reject('Network error while fetching MioCar config.'),
            });
        });
    }

    // --- DATA HARVESTING ---
    function manageTokens() {
        if (window.location.host.includes("invers.com")) {
            const rawToken = localStorage.getItem("auth_token");
            if (rawToken) {
                const token = rawToken.startsWith("Bearer") ? rawToken : "Bearer " + rawToken;
                GM_setValue("invers_auth_token", token);
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.includes("ui-data:fleet:")) {
                        GM_setValue("invers_fleet_id", key.split(":")[2]);
                        break;
                    }
                }
            }
        }
    }

    // Scrapes the booking times from the Share.car UI
    function getBookingTimes() {
        const labels = Array.from(document.querySelectorAll('label, div, span'));
        let start = null, end = null;

        // Universal date parser for Chrome on Windows & Mac
        const parseDate = (str) => {
            if (!str || str.includes("--:--")) return null;

            // 1. Normalize weird spaces (like narrow non-breaking spaces in times)
            let cleanStr = str.replace(/[\u202F\u00A0\s]+/g, ' ').trim();

            // 2. Rearrange "10:30 PM on Aug 7, 2025" -> "Aug 7, 2025 10:30 PM"
            // Chrome handles this specific arrangement flawlessly across all OS's.
            const parts = cleanStr.split(/ on /i);
            const formattedStr = parts.length === 2
                ? `${parts[1].trim()} ${parts[0].trim()}`
                : cleanStr;

            const d = new Date(formattedStr);
            return isNaN(d.getTime()) ? null : d;
        };

        labels.forEach(el => {
            const text = el.innerText.trim();
            // Using strict equality avoids accidentally grabbing parent divs
            if (text === "Actual Start Time" || (text === "Start Time" && !start)) {
                const timeStr = el.nextElementSibling?.innerText;
                if (timeStr) start = parseDate(timeStr) || start;
            }
            if (text === "Actual End Time" || (text === "End Time" && !end)) {
                const timeStr = el.nextElementSibling?.innerText;
                if (timeStr) end = parseDate(timeStr) || end;
            }
        });

        // Fallback: If no end time (ongoing booking), use "Now"
        if (start && !end) end = new Date();
        return (start && end) ? { start, end } : null;
    }

    async function apiCall(method, url, data) {
        return new Promise((resolve, reject) => {
            const token = GM_getValue("invers_auth_token");
            const fleetId = GM_getValue("invers_fleet_id", "T9F9Q");
            if (!token) {
                alert("⚠️ Session expired. Visit Invers FleetControl to refresh.");
                return reject("No token");
            }
            GM_xmlhttpRequest({
                method: method, url: url,
                headers: { "Content-Type": "application/json", "Authorization": token, "x-invers-fleet-id": fleetId },
                data: data ? JSON.stringify(data) : null,
                onload: res => (res.status >= 200 && res.status < 300) ? resolve(JSON.parse(res.responseText)) : reject(res.responseText),
                onerror: err => reject("Network Error")
            });
        });
    }

    // --- EXPORT LOGIC ---
    async function runExport(vehicleId, startDate, endDate) {
        updateBtn("⏳ Fetching...");
        let allEvents = [];
        let nextPageToken = null;

        let config;
        try {
            config = await fetchMioCarConfig();
        } catch (e) {
            if (e === 'not_authenticated') {
                alert("⚠️ Please log in at miocar.org first to use this script.");
            } else {
                alert("⚠️ Could not reach MioCar config: " + e);
            }
            updateBtn("Export Invers Data");
            return;
        }

        try {
            do {
                const payload = {
                    "vehicle_id": vehicleId,
                    "occurred_before": endDate.toISOString(),
                    "occurred_after": startDate.toISOString(),
                    "limit": 1000,
                    "event_types": ["IGNITION_CHANGED"]
                };
                if (nextPageToken) payload.page_token = nextPageToken;
                const data = await apiCall("POST", `${config.inversApiBase}/event-log-entries/query`, payload);
                allEvents = allEvents.concat(data.items || []);
                nextPageToken = data.next_page_token;
            } while (nextPageToken);

            if (allEvents.length === 0) alert("No events found in this range.");
            else downloadCSV(allEvents, vehicleId);
        } catch (e) { alert("Export Error: " + e); }
        updateBtn("Export Invers Data");
    }

    function downloadCSV(events, vid) {
        const rows = ["Vehicle ID,Timestamp,Latitude,Longitude,Event Type"];
        events.forEach(e => {
            rows.push(`"${vid}","${e.occurred_at}","${e.position?.value?.lat || 'N/A'}","${e.position?.value?.lon || 'N/A'}","IGNITION_CHANGED"`);
        });
        const blob = new Blob([rows.join("\n")], { type: 'text/csv' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Ignition_${vid}.csv`;
        link.click();
    }

    // --- UI MODAL ---
    function createModal(onConfirm) {
        if (document.getElementById('invers-range-modal')) return;
        const bookingRange = getBookingTimes();

        const overlay = document.createElement('div');
        overlay.id = 'invers-range-modal';
        Object.assign(overlay.style, { position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: '100001', display: 'flex', justifyContent: 'center', alignItems: 'center' });

        const box = document.createElement('div');
        Object.assign(box.style, { backgroundColor: 'white', padding: '25px', borderRadius: '10px', width: '400px', fontFamily: 'Arial, sans-serif', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' });

        box.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: #333;">Export Ignition Logs</h3>

            <button id="this-booking-btn" style="width:100%; padding:15px; background:#28a745; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold; margin-bottom:15px; ${!bookingRange ? 'opacity:0.5; cursor:not-allowed;' : ''}">
                📅 This Booking
                <div style="font-size:10px; font-weight:normal;">${bookingRange ? 'Detected reservation times' : 'Times not found on page'}</div>
            </button>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                <button class="preset-btn" data-days="1">Last 24h</button>
                <button class="preset-btn" data-days="3">Last 3 Days</button>
                <button class="preset-btn" data-days="7">Last 7 Days</button>
                <button class="preset-btn" data-days="30">Last 30 Days</button>
            </div>

            <button id="toggle-custom" style="width:100%; padding: 10px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 5px; cursor: pointer; font-weight: bold; color: #555; margin-bottom: 15px;">
                Custom Range...
            </button>

            <div id="custom-picker-area" style="display:none; border-top: 1px solid #eee; padding-top: 15px;">
                <label style="display:block; font-size:11px; font-weight:bold; margin-bottom:5px">Start:</label>
                <input type="datetime-local" id="start-date" style="width:100%; padding:8px; margin-bottom:10px; border:1px solid #ccc; border-radius:4px">
                <label style="display:block; font-size:11px; font-weight:bold; margin-bottom:5px">End:</label>
                <input type="datetime-local" id="end-date" style="width:100%; padding:8px; margin-bottom:15px; border:1px solid #ccc; border-radius:4px">
                <button id="conf-custom" style="width:100%; background:#007bff; color:white; border:none; padding:12px; border-radius:5px; cursor:pointer; font-weight:bold">Run Custom Export</button>
            </div>

            <div style="text-align:center; margin-top: 15px;"><button id="close-modal" style="background:none; border:none; color:#999; cursor:pointer;">Cancel</button></div>
        `;

        const style = document.createElement('style');
        style.innerHTML = `.preset-btn { padding: 12px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }`;
        document.head.appendChild(style);

        document.body.appendChild(overlay);
        overlay.appendChild(box);

        // --- HANDLERS ---
        if (bookingRange) {
            document.getElementById('this-booking-btn').onclick = () => {
                overlay.remove();
                onConfirm(bookingRange.start, bookingRange.end);
            };
        }

        box.querySelectorAll('.preset-btn').forEach(btn => {
            btn.onclick = () => {
                const end = new Date(), start = new Date();
                start.setDate(end.getDate() - parseInt(btn.getAttribute('data-days')));
                overlay.remove();
                onConfirm(start, end);
            };
        });

        document.getElementById('toggle-custom').onclick = () => {
            const area = document.getElementById('custom-picker-area');
            area.style.display = area.style.display === 'none' ? 'block' : 'none';
        };

        document.getElementById('conf-custom').onclick = () => {
            const s = document.getElementById('start-date').value, e = document.getElementById('end-date').value;
            if(s && e) { overlay.remove(); onConfirm(new Date(s), new Date(e)); }
        };

        document.getElementById('close-modal').onclick = () => overlay.remove();
    }

    function updateBtn(text) {
        const btn = document.getElementById(CONFIG.btnId);
        if (btn) btn.innerText = text;
    }

    function checkAndRender() {
        manageTokens();
        const host = window.location.host, url = window.location.href;
        let plate = null, uuid = null, isValid = false;

        if (host.includes("share.car") && url.includes("/bookings/")) {
            const match = document.body.innerText.match(/([A-Z0-9]+).*?\(Hardware:\s*Invers\)/i);
            if (match && match[1]) { plate = match[1].trim(); isValid = true; }
        } else if (host.includes("invers.com")) {
            const match = url.match(/\/vehicles\/([a-zA-Z0-9-]+)\/events/) || url.match(/\/events\/([a-zA-Z0-9-]+)/);
            if (match) { uuid = match[1]; isValid = true; }
        }

        if (!isValid) { document.getElementById(CONFIG.btnId)?.remove(); return; }
        if (document.getElementById(CONFIG.btnId)) return;

        const btn = document.createElement('button');
        btn.id = CONFIG.btnId; btn.innerText = "Export Invers Data";
        Object.assign(btn.style, CONFIG.btnStyle);
        if (plate) btn.style.backgroundColor = '#2c3e50';

        btn.onclick = async () => {
            const token = GM_getValue("invers_auth_token");
            if (!token) return alert("Please open Invers FleetControl first to authorize.");

            let config;
            try {
                config = await fetchMioCarConfig();
            } catch (e) {
                if (e === 'not_authenticated') {
                    return alert("⚠️ Please log in at miocar.org first to use this script.");
                }
                return alert("⚠️ Could not reach MioCar config: " + e);
            }

            if (plate && !uuid) {
                try { uuid = (await apiCall("GET", `${config.inversApiBase}/vehicles?q=${plate}&limit=1`)).items[0].id; }
                catch(e) { return; }
            }
            createModal((start, end) => runExport(uuid, start, end));
        };
        document.body.appendChild(btn);
    }

    setInterval(checkAndRender, 2000);
})();
