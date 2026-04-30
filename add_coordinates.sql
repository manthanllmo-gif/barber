-- Add latitude and longitude columns to shops table
ALTER TABLE shops ADD COLUMN IF NOT EXISTS latitude FLOAT8;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS longitude FLOAT8;

-- Update coordinates for existing shops
UPDATE shops SET latitude = 23.199934333851743, longitude = 77.44740496951451 WHERE name = 'Sparkel';
UPDATE shops SET latitude = 23.210899601855726, longitude = 77.4363328105765 WHERE name = 'Salman';
UPDATE shops SET latitude = 23.2258077672377, longitude = 77.4363328105765 WHERE name = 'Sunny';
UPDATE shops SET latitude = 23.190091697546812, longitude = 77.46508317145091 WHERE name = 'New Minal';
UPDATE shops SET latitude = 23.19267905922188, longitude = 77.433398469779 WHERE name = 'Sameer';
