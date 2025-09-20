-- Insert default departments
INSERT INTO departments (name, description) VALUES
('Public Works', 'Roads, bridges, and infrastructure maintenance'),
('Sanitation', 'Waste management and cleanliness'),
('Water Supply', 'Water distribution and quality'),
('Electricity', 'Power supply and electrical issues'),
('Healthcare', 'Public health and medical facilities'),
('Education', 'Schools and educational infrastructure'),
('Police', 'Law enforcement and security'),
('Environment', 'Environmental protection and pollution control');

-- Insert sample regions for Jharkhand
INSERT INTO regions (name, coordinates) VALUES
('Ranchi', ST_GeomFromText('POLYGON((85.0 23.0, 85.5 23.0, 85.5 23.5, 85.0 23.5, 85.0 23.0))', 4326)),
('Dhanbad', ST_GeomFromText('POLYGON((86.0 23.5, 86.5 23.5, 86.5 24.0, 86.0 24.0, 86.0 23.5))', 4326)),
('Jamshedpur', ST_GeomFromText('POLYGON((86.0 22.5, 86.5 22.5, 86.5 23.0, 86.0 23.0, 86.0 22.5))', 4326)),
('Bokaro', ST_GeomFromText('POLYGON((85.5 23.5, 86.0 23.5, 86.0 24.0, 85.5 24.0, 85.5 23.5))', 4326)),
('Deoghar', ST_GeomFromText('POLYGON((86.5 24.0, 87.0 24.0, 87.0 24.5, 86.5 24.5, 86.5 24.0))', 4326));

-- Insert default admin user
INSERT INTO users (mobile_number, name, role, is_verified) VALUES
('9999999999', 'System Admin', 'admin', TRUE);
