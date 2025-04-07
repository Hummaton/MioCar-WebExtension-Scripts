const fs = require("fs");
const path = require("path");


const inputPath = path.join(__dirname, "jsonBookings", "InputJsonFile.txt"); 
const outputPath = path.join(__dirname, "jsonBookings", "cleaned_bookings.json"); 

const rawData = fs.readFileSync(inputPath, "utf8");
const data = JSON.parse(rawData);


const response = data.response;
const embedded = response?._embedded;
const bookings = embedded?.items || [];

const fieldsToKeep = [
    "status",
    "createdAt",
    "pickUpDatetime",
    "dropOffDatetime",
    "vehicleMake",
    "vehicleModel",
    "vehiclePlate",
    "stationName",
    "totalRevenue",
    "type"
];



for (let i = 0; i < bookings.length; i++) {
    const original = bookings[i];
    const cleaned = {};

    for (const field of fieldsToKeep) {
        if (field in original) {
            let value = original[field];

       
            if (field === "status") {
                value = value === "Finished" ? 1 : 0;
            }

            cleaned[field] = value;
        }
    }

    bookings[i] = cleaned;
}


fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));

console.log("Cleaned data saved to:", outputPath);
