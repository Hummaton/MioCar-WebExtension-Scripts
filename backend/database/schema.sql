CREATE TABLE bookings (
    id INTEGER PRIMARY KEY,
    community_name VARCHAR(255),
    created_at TIMESTAMP,
    created_by VARCHAR(255),
    dropoff_datetime TIMESTAMP,
    pickup_datetime TIMESTAMP,
    status VARCHAR(50),
    total_revenue FLOAT,
    trip_distance FLOAT,
    trip_dropoff_datetime TIMESTAMP,
    trip_pickup_datetime TIMESTAMP,
    member_id INTEGER REFERENCES members(id),
    station_id INTEGER REFERENCES stations(id),
    vehicle_id INTEGER REFERENCES vehicles(id)
);

CREATE TABLE vehicles (
    id INTEGER PRIMARY KEY,
    colour VARCHAR(50),
    year INTEGER,
    registration_plate VARCHAR(100),
    odometer INTEGER,
    model_full_name VARCHAR(100),
    station_id INTEGER REFERENCES stations(id)
);

CREATE TABLE recent_members (
    id INTEGER PRIMARY KEY,
    full_name VARCHAR(255),
    created_at TIMESTAMP,
    driving_licence_status VARCHAR(50)
);

CREATE TABLE stations (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255),
    status_label VARCHAR(50)
);

CREATE TABLE members (
    id INTEGER PRIMARY KEY,
    created_at TIMESTAMP,
    first_name VARCHAR(100),
    last_name VARCHAR(100)
);
