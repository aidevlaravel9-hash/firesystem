# Building Management API Documentation

## Base URL
```
http://localhost:5000/api/building
```

## Authentication
All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Create Building
**POST** `/create_building`

Create a new building record.

**Request Body:**
```json
{
  "customer_id": 1,
  "building_name": "Main Office Building",
  "postcode": "380001",
  "country_id": 1,
  "state_id": 5,
  "city_id": 10,
  "address": "123 Business Park, Sector 5",
  "landmark": "Near City Mall",
  "status": "active"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Building created successfully"
}
```

---

### 2. Get All Buildings (Listing)
**POST** `/buildinglist`

Retrieve all buildings with pagination and filtering.

**Request Body:**
```json
{
  "page": 1,
  "limit": 10,
  "search": "office",
  "customer_id": 1,
  "status": "active"
}
```

**Response (200):**
```json
{
  "success": true,
  "page": 1,
  "limit": 10,
  "total": 25,
  "total_pages": 3,
  "data": [
    {
      "building_id": 1,
      "customer_id": 1,
      "customer_name": "ABC Corp",
      "building_name": "Main Office Building",
      "postcode": "380001",
      "country_id": 1,
      "country_name": "India",
      "state_id": 5,
      "state_name": "Gujarat",
      "city_id": 10,
      "city_name": "Ahmedabad",
      "address": "123 Business Park, Sector 5",
      "landmark": "Near City Mall",
      "status": "active",
      "created_by_id": 1,
      "created_by_name": "admin",
      "created_at": "2026-05-13T10:30:00.000Z",
      "updated_at": "2026-05-13T10:30:00.000Z"
    }
  ]
}
```

---

### 3. Get Building by ID (For Edit)
**POST** `/get_building_by_id`

Retrieve a specific building by ID for editing.

**Request Body:**
```json
{
  "building_id": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "building_id": 1,
    "customer_id": 1,
    "customer_name": "ABC Corp",
    "building_name": "Main Office Building",
    "postcode": "380001",
    "country_id": 1,
    "country_name": "India",
    "state_id": 5,
    "state_name": "Gujarat",
    "city_id": 10,
    "city_name": "Ahmedabad",
    "address": "123 Business Park, Sector 5",
    "landmark": "Near City Mall",
    "status": "active",
    "created_by_id": 1,
    "created_by_name": "admin",
    "created_at": "2026-05-13T10:30:00.000Z",
    "updated_at": "2026-05-13T10:30:00.000Z"
  }
}
```

---

### 4. Update Building Status
**POST** `/update_building_status`

Update only the status of a building.

**Request Body:**
```json
{
  "building_id": 1,
  "status": "inactive"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Building status updated successfully"
}
```

---

### 5. Update Building
**POST** `/update_building`

Update an existing building record.

**Request Body:**
```json
{
  "building_id": 1,
  "customer_id": 1,
  "building_name": "Main Office Building - Updated",
  "postcode": "380001",
  "country_id": 1,
  "state_id": 5,
  "city_id": 10,
  "address": "123 Business Park, Sector 5, Updated Address",
  "landmark": "Near City Mall",
  "status": "active"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Building updated successfully"
}
```

---

### 6. Delete Building
**POST** `/delete_building`

Delete a building record and its associated QR code.

**Request Body:**
```json
{
  "building_id": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Building deleted successfully"
}
```

---

### 7. Generate QR Code
**POST** `/generate_qrcode`

Generate and store QR code for a building with all its information.

**Request Body:**
```json
{
  "building_id": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "QR Code generated successfully",
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "qrFilePath": "http://localhost:5000/uploads/qrcodes/building_1.png",
    "buildingInfo": {
      "building_id": 1,
      "building_name": "Main Office Building",
      "customer_name": "ABC Corp",
      "customer_id": 1,
      "postcode": "380001",
      "country_id": 1,
      "state_id": 5,
      "city_id": 10,
      "address": "123 Business Park, Sector 5",
      "landmark": "Near City Mall",
      "status": "active",
      "created_at": "2026-05-13T10:30:00.000Z"
    }
  }
}
```

---

### 8. Print QR Code
**POST** `/print_qrcode`

Get a printable HTML page with QR code and building information.

**Request Body:**
```json
{
  "building_id": 1
}
```

**Response (200):**
Returns an HTML page with:
- High-quality QR code (500x500px)
- Building information
- Print button
- Print-optimized styling

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "customer_id and building_name are required"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized: user not found"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Building not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error message details"
}
```

---

## Database Schema

### Table: building_management

| Column | Type | Description |
|--------|------|-------------|
| building_id | INT (PK, AUTO_INCREMENT) | Primary key |
| customer_id | INT (NOT NULL) | Foreign key to customer table |
| building_name | VARCHAR(255) (NOT NULL) | Name of the building |
| postcode | VARCHAR(20) | Postal code |
| country_id | INT | Foreign key to countrymaster table |
| state_id | INT | Foreign key to statemaster table |
| city_id | INT | Foreign key to citymaster table |
| address | TEXT | Full address |
| landmark | VARCHAR(255) | Nearby landmark |
| status | VARCHAR(20) | Building status (default: 'active') |
| created_by_id | INT | Foreign key to users table |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

---

## Frontend Integration Examples

### 1. Create Building
```javascript
async function createBuilding(formData) {
  const response = await fetch('http://localhost:5000/api/building/create_building', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(formData)
  });
  const data = await response.json();
  return data;
}
```

### 2. Get All Buildings
```javascript
async function getBuildingList(page = 1, limit = 10, search = '') {
  const response = await fetch('http://localhost:5000/api/building/buildinglist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ page, limit, search })
  });
  const data = await response.json();
  return data;
}
```

### 3. Generate QR Code
```javascript
async function generateQR(buildingId) {
  const response = await fetch('http://localhost:5000/api/building/generate_qrcode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ building_id: buildingId })
  });
  const data = await response.json();
  
  if (data.success) {
    // Display QR code
    document.getElementById('qrImage').src = data.data.qrCode;
  }
}
```

### 4. Print QR Code
```javascript
async function printQR(buildingId) {
  const response = await fetch('http://localhost:5000/api/building/print_qrcode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ building_id: buildingId })
  });
  const html = await response.text();
  
  // Open in new window
  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
}
```

---

## Notes

- All endpoints use POST method (matching customer module pattern)
- All endpoints require authentication via JWT token
- QR codes are stored in `/uploads/qrcodes/` directory
- QR codes contain complete building information in JSON format
- QR codes are automatically deleted when building is deleted
- The listing endpoint supports search, filtering, and pagination
- Transactions are used for data integrity
- All timestamps are automatically managed by the database
