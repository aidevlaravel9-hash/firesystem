# Component Management API Documentation

## Base URL
```
http://localhost:5000/api/auth
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 1. Create Component

**Endpoint:** `POST /create_component`

**Description:** Create a new component

**Request Body:**
```json
{
  "component_name": "Fire Alarm"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Component created successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or duplicate component name
- `401 Unauthorized` - User not authenticated

---

## 2. Component List (with Search & Pagination)

**Endpoint:** `POST /componentlist`

**Description:** Get paginated list of components with search functionality

**Request Body:**
```json
{
  "page": 1,
  "limit": 10,
  "search": "Fire"
}
```

**Parameters:**
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 10) - Items per page
- `search` (optional) - Search by component name

**Success Response (200):**
```json
{
  "success": true,
  "page": 1,
  "limit": 10,
  "total": 25,
  "total_pages": 3,
  "data": [
    {
      "component_id": 1,
      "component_name": "Fire Alarm",
      "component_status": 1,
      "created_by_id": 1,
      "created_by_name": "Admin User",
      "created_at": "2026-05-01T10:30:00.000Z",
      "updated_at": "2026-05-01T10:30:00.000Z"
    }
  ]
}
```

---

## 3. Get Component By ID

**Endpoint:** `POST /get_component_by_id`

**Description:** Get detailed information of a specific component

**Request Body:**
```json
{
  "component_id": 1
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "component_id": 1,
    "component_name": "Fire Alarm",
    "component_status": 1,
    "created_by_id": 1,
    "created_by_name": "Admin User",
    "created_at": "2026-05-01T10:30:00.000Z",
    "updated_at": "2026-05-01T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing component_id
- `404 Not Found` - Component not found

---

## 4. Update Component Status

**Endpoint:** `POST /update_component_status`

**Description:** Update component status (active/inactive)

**Request Body:**
```json
{
  "component_id": 1,
  "status": 0
}
```

**Parameters:**
- `component_id` (required) - Component ID
- `status` (required) - Status value (1 = Active, 0 = Inactive)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Component status updated successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields
- `404 Not Found` - Component not found

---

## 5. Update Component

**Endpoint:** `POST /update_component`

**Description:** Update component information

**Request Body:**
```json
{
  "component_id": 1,
  "component_name": "Fire Alarm System"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Component updated successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields or duplicate component name
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Component not found

---

## 6. Delete Component

**Endpoint:** `POST /delete_component`

**Description:** Delete a component

**Request Body:**
```json
{
  "component_id": 1
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Component deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Missing component_id
- `404 Not Found` - Component not found

---

## 7. Component Dropdown List

**Endpoint:** `POST /componentDropdownList`

**Description:** Get list of active components for dropdown (id and name only)

**Request Body:**
```json
{}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Fire Alarm"
    },
    {
      "id": 2,
      "name": "Fire Extinguisher"
    }
  ]
}
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `404` - Not Found
- `500` - Internal Server Error

---

## Database Schema

### Component Table Structure

```sql
CREATE TABLE component (
    component_id INT PRIMARY KEY AUTO_INCREMENT,
    component_name VARCHAR(255) NOT NULL,
    component_status TINYINT(1) DEFAULT 1,
    created_by_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_id) REFERENCES users(user_id) ON DELETE SET NULL
);
```

**Field Descriptions:**
- `component_id` - Primary key, auto-increment
- `component_name` - Component name (required, unique)
- `component_status` - Status flag (1 = Active, 0 = Inactive)
- `created_by_id` - Foreign key to users table
- `created_at` - Timestamp of creation
- `updated_at` - Timestamp of last update

---

## Testing with Postman

1. **Import the collection** - Use the Postman collection file provided
2. **Set environment variables:**
   - `base_url`: http://localhost:5000
   - `token`: Your JWT authentication token
3. **Test the endpoints** in the following order:
   - Login to get token
   - Create Component
   - Component List
   - Get Component By ID
   - Update Component
   - Update Component Status
   - Component Dropdown List
   - Delete Component
