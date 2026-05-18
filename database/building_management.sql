-- Create building_management table
CREATE TABLE IF NOT EXISTS building_management (
    building_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    building_name VARCHAR(255) NOT NULL,
    postcode VARCHAR(20),
    country_id INT,
    state_id INT,
    city_id INT,
    address TEXT,
    landmark VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_by_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Add indexes for better performance
CREATE INDEX idx_customer_id ON building_management(customer_id);
CREATE INDEX idx_status ON building_management(status);
CREATE INDEX idx_created_by ON building_management(created_by_id);
