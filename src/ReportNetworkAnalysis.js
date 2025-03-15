
function getBrowserStorageValue(key) {
    try {
        const value = localStorage.getItem(key);
        if (value) {
            const parsedValue = JSON.parse(value);
            return parsedValue;
        } else {
            console.warn(`Specified key "${key}" not found in localStorage.`);
        }
    } catch (error) {
        console.error(`Error parsing the key: ${key}`, error);
    }

    return null; // Return null if no value is found
}

function getPostHeader() {
    const apiKey = getBrowserStorageValue('oauth')?.access_token;
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Referer': referer,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"macOS"'
    };

    return headers;
}

const url = API_ENDPOINT;
const referer = POST_HEADERS_REFERER;

let requestHeaders = getPostHeader();

const request_payload = {
    scheme: 93, 
    dateFrom: "2025-01-25", 
    dateTo: "2025-02-25"
};

// Initialize response and POST API request fields
var response;
let requestBody = JSON.stringify(request_payload);

// Send POST to server
try {
    response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body: requestBody
    });
} catch (error) {
    console.error('Error making POST request:', error);
}

console.log(response);
