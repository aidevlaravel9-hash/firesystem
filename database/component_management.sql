-- Create component table
CREATE TABLE IF NOT EXISTS component (
    component_id INT PRIMARY KEY AUTO_INCREMENT,
    component_name VARCHAR(255) NOT NULL,
    component_status TINYINT(1) DEFAULT 1 COMMENT '1=Active, 0=Inactive',
    created_by_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Add indexes for better performance
CREATE INDEX idx_component_name ON component(component_name);
CREATE INDEX idx_component_status ON component(component_status);
CREATE INDEX idx_created_by ON component(created_by_id);

-- Insert sample data (optional)
INSERT INTO component (component_name, component_status, created_by_id) VALUES
('Fire Alarm', 1, 1),
('Fire Extinguisher', 1, 1),
('Smoke Detector', 1, 1),
('Sprinkler System', 1, 1),
('Emergency Exit Light', 1, 1);
