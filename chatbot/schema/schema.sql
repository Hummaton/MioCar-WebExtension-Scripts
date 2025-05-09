CREATE TABLE stations (
    id INTEGER PRIMARY KEY, -- Station ID
    name VARCHAR(255), -- Station name
    status_label VARCHAR(50), -- Status of the station (active, inactive, etc.)    
    community_id INTEGER REFERENCES community(id) -- Community where the station is located
);

CREATE TABLE members (
    id INTEGER PRIMARY KEY, -- Member ID
    created_at TIMESTAMP, -- Member creation timestamp
    first_name VARCHAR(100), -- Member's first name
    last_name VARCHAR(100) -- Member's last name
);


CREATE TABLE vehicles (
    id INTEGER PRIMARY KEY, -- Vehicle ID
    colour VARCHAR(50), -- Vehicle colour
    year INTEGER, -- Vehicle year
    registration_plate VARCHAR(100), -- Vehicle registration plate
    odometer INTEGER, -- Vehicle odometer reading
    model_full_name VARCHAR(100), -- Full name of the vehicle model
    station_id INTEGER REFERENCES stations(id) -- Station where the vehicle is located
);

CREATE TABLE bookings (
    id_hash VARCHAR(20) PRIMARY KEY, -- Hash of the booking ID
    status VARCHAR(50), -- Booking status
    created_at TIMESTAMP, -- Booking creation timestamp
    pickup_datetime TIMESTAMP, -- Pickup datetime
    dropoff_datetime TIMESTAMP, -- Drop-off datetime
    total_revenue FLOAT, -- Total revenue from the booking
    trip_distance FLOAT, -- Distance of the trip
    trip_dropoff_datetime TIMESTAMP, -- Trip drop-off datetime
    trip_pickup_datetime TIMESTAMP, -- Trip pickup datetime
    member_id INTEGER REFERENCES members(id), -- Member who made the booking
    station_id INTEGER REFERENCES stations(id), -- Station where the booking was made
    vehicle_id INTEGER REFERENCES vehicles(id), -- Vehicle used for the booking
    community_id INTEGER REFERENCES community(id) -- Community where the booking was made
);

CREATE TABLE approvals (
    id INTEGER PRIMARY KEY, -- Approval ID
    full_name VARCHAR(255), -- Full name of the member who needs to be approved
    created_at TIMESTAMP, -- Request timestamp
    driving_licence_status VARCHAR(50) -- Driver licence status for the member
);

CREATE TABLE community (
    id INTEGER PRIMARY KEY, -- Community ID
    name VARCHAR(255), -- Community name
    status_label VARCHAR(50) -- Community status (active, inactive, etc.)
);
