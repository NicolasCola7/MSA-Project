CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS stations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicles (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    battery_level INT CHECK (battery_level >= 0 AND battery_level <= 100),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    station_id VARCHAR(50),
    
    CONSTRAINT fk_vehicle_station 
        FOREIGN KEY (station_id) 
        REFERENCES stations(id)
        ON DELETE SET NULL
);


INSERT INTO stations (id, name) VALUES 
    ('ST-001', 'Stazione Centrale'),
    ('ST-002', 'Piazza Maggiore'),
    ('ST-003', 'Via Irnerio'),
    ('ST-004', 'Porta San Felice'),
    ('ST-005', 'Via delle Lame');


INSERT INTO vehicles (id, type, model, status, battery_level, latitude, longitude, station_id) VALUES 
    ('V001', 'SCOOTER', 'NIU NQi GTs', 'AVAILABLE', 92, 44.4949, 11.3426, 'ST-001'),
    ('V002', 'KICK_SCOOTER', 'Xiaomi 4 Pro', 'AVAILABLE', 78, 44.4968, 11.3396, 'ST-002'),
    ('V003', 'CAR', 'Fiat 500e', 'AVAILABLE', 55, 44.5008, 11.3512, 'ST-003'),
    ('V004', 'SCOOTER', 'Vespa Elettrica', 'AVAILABLE', 88, 44.4901, 11.3303, 'ST-004'),
    ('V005', 'KICK_SCOOTER', 'Segway Ninebot Max', 'AVAILABLE', 41, 44.5045, 11.3489, 'ST-005');


INSERT INTO users (id, email, password, name) VALUES 
    ('mock-user-123', 'user@acme.com', 'password123', 'Test User')
ON CONFLICT (id) DO NOTHING;