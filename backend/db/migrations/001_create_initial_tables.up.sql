-- Enable PostGIS extension for geospatial functionality
CREATE EXTENSION IF NOT EXISTS postgis;

-- Users table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  mobile_number VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'citizen', -- citizen, admin, department_head
  department_id BIGINT,
  region_id BIGINT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Departments table
CREATE TABLE departments (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Regions table
CREATE TABLE regions (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  coordinates GEOMETRY(POLYGON, 4326), -- GeoJSON polygon using WGS84
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Issues table
CREATE TABLE issues (
  id BIGSERIAL PRIMARY KEY,
  reporter_id BIGINT NOT NULL REFERENCES users(id),
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  specific_issue VARCHAR(200) NOT NULL,
  region VARCHAR(100) NOT NULL,
  location GEOMETRY(POINT, 4326) NOT NULL, -- GPS coordinates
  location_address TEXT,
  severity_score INTEGER NOT NULL DEFAULT 1 CHECK (severity_score BETWEEN 1 AND 5),
  status VARCHAR(50) NOT NULL DEFAULT 'submitted', -- submitted, in_progress, resolved, rejected
  assigned_department_id BIGINT REFERENCES departments(id),
  assigned_region_id BIGINT REFERENCES regions(id),
  image_urls TEXT[] DEFAULT '{}',
  report_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
  id BIGSERIAL PRIMARY KEY,
  issue_id BIGINT NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OTP verification table
CREATE TABLE otp_verifications (
  id BIGSERIAL PRIMARY KEY,
  mobile_number VARCHAR(15) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_mobile ON users(mobile_number);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_issues_reporter ON issues(reporter_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_category ON issues(category);
CREATE INDEX idx_issues_location ON issues USING GIST(location);
CREATE INDEX idx_issues_created_at ON issues(created_at);
CREATE INDEX idx_comments_issue ON comments(issue_id);
CREATE INDEX idx_otp_mobile ON otp_verifications(mobile_number);
CREATE INDEX idx_otp_expires ON otp_verifications(expires_at);

-- Add foreign key constraints
ALTER TABLE users ADD CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id);
ALTER TABLE users ADD CONSTRAINT fk_users_region FOREIGN KEY (region_id) REFERENCES regions(id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
