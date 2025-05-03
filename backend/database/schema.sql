CREATE TABLE bookings (
    id INTEGER PRIMARY KEY,
    community_name VARCHAR(255),
    created_at TIMESTAMP,
    created_by VARCHAR(255),
    dropoff_datetime TIMESTAMP,
    pickup_datetime TIMESTAMP, 
    member_id INTEGER REFERENCES members(id),
    station_id INTEGER REFERENCES stations(id),
    station_name VARCHAR(255),
    status VARCHAR(50),
    total_revenue FLOAT,
    trip_distance FLOAT,
    trip_dropoff_datetime TIMESTAMP,
    trip_pickup_datetime TIMESTAMP,         
    vehicle_id INTEGER REFERENCES vehicles(id)
);

CREATE TABLE vehicles (
    id INTEGER PRIMARY KEY,
    colour VARCHAR(50),
    doors INTEGER,
    fuelType VARCHAR(50),
    transmission VARCHAR(50),
    year INTEGER,
    registrationPlate VARCHAR(100),
    vehicleNumber VARCHAR(100),
    fullName TEXT,
    notes TEXT,
    imageToDisplay TEXT,
    imageFilename TEXT,

    -- WAITING TO BE DISCUSSED WHETER TO ADD MODEL OR NOT
    model_id INTEGER,
    model_name VARCHAR(100),
    model_fullName TEXT,
    model_vehicleType_key VARCHAR(50),
    model_vehicleType_label VARCHAR(50),
    model_category VARCHAR(50),


    manufacturer_id INTEGER,
    manufacturer_name VARCHAR(100),
    station_id INTEGER REFERENCES stations(id)
);


CREATE TABLE recentMember(
    id INTEGER PRIMARY KEY,  
    fullName VARCHAR(255),
    createdAt TIMESTAMP,
    updatedAt TIMESTAMP,
    email VARCHAR(255),
    phoneNumber VARCHAR(100),
    address TEXT,
    personaInfo_status VARCHAR(50),
    communityApproval_status VARCHAR(50),
    drivingLicence_status VARCHAR(50),
);


CREATE TABLE stations (
    id INTEGER PRIMARY KEY,  
    name VARCHAR(255),
    status_label VARCHAR(50),
    community_id INTEGER,

);

CREATE TABLE members (
    id INTEGER PRIMARY KEY,
    email VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    display_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),

);
