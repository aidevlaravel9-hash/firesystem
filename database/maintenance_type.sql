-- Create maintenance_type table
CREATE TABLE IF NOT EXISTS maintenance_type (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type_id VARCHAR(255) NOT NULL,
    maintenance_cycle TEXT COMMENT 'Comma-separated values like Monthly,Quarterly,Annual',
    status TINYINT(1) DEFAULT 1 COMMENT '1=Active, 0=Inactive',
    created_by_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Add indexes for better performance
CREATE INDEX idx_type_id ON maintenance_type(type_id);
CREATE INDEX idx_status ON maintenance_type(status);
CREATE INDEX idx_created_by ON maintenance_type(created_by_id);

-- Insert sample data (optional)
INSERT INTO maintenance_type (type_id, maintenance_cycle, status, created_by_id) VALUES
('Maintenance Cycle', 'Monthly,Quarterly', 1, 1),
('Maintenance Type', 'Quarterly,Yearly', 1, 1),
('Fire Safety', 'Weekly,Monthly,Yearly', 1, 1);
