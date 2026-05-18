# API Documentation - Employee & Customer Management

## Base URL
```
http://localhost:3000
```

## Authentication
All APIs require JWT token in the Authorization header:
```
Authorization: your_jwt_token_here
```

---

## 📋 Employee APIs

### 1. Create Employee
**Endpoint:** `POST /api/employee/create_employee`

**Headers:**
```
Authorization: your_jwt_token_here
Content-Type: application/json
```

**Request Body (Raw JSON):**
```json
{
  "name": "John Doe",
  "role_id": 2,
  "email": "john.doe@example.com",
  "mobilenumber": "1234567890",
  "postcode": "12345",
  "address": "123 Main Street",
  "countryid": 1,
  "stateid": 1,
  "cityid": 1,
  "uploadsignatureimg": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Employee created successfully",
  "generatedPassword": "johndoe@123",
  "imagePath": null,
  "imageUrl": null
}
```

---

### 2. Employee List
**Endpoint:** `POST /api/employee/employeelist`

**Headers:**
```
Authorization: your_jwt_token_here
Content-Type: application/json
```

**Request Body (Raw JSON):**
```json
{
  "page": 1,
  "limit": 10,
  "search": "",
  "role_id": null
}
```

**Response:**
```json
{
  "success": true,
  "page": 1,
  "limit": 10,
  "total": 5,
  "total_pages": 1,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "mobile_number": "1234567890",
      "postcode": "12345",
      "address": "123 Main Street",
      "status": 1,
      "role_id": 2,
      "role_name": "Manager",
      "countryid": 1,
      "country_name": "USA",
      "stateid": 1,
      "state_name": "California",
      "cityid": 1,
      "city_name": "Los Angeles",
      "uploadsignatureimg": null,
      "signature_url": null,
      "createdAt": "2026-05-13T10:30:00.000Z"
    }
  ]
}
```

---

### 3. Get Employee By ID ✨ NEW
**Endpoint:** `POST /api/employee/get_employee_by_id`

**Headers:**
```
Authorization: your_jwt_token_here
Content-Type: application/json
```

**Request Body (Raw JSON):**
```json
{
  "employee_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "mobile_number": "1234567890",
    "postcode": "12345",
    "address": "123 Main Street",
    "status": 1,
    "role_id": 2,
    "role_name": "Manager",
    "countryid": 1,
    "country_name": "USA",
    "stateid": 1,
    "state_name": "California",
    "cityid": 1,
    "city_name": "Los Angeles",
    "uploadsignatureimg": null,
    "created_by_id": 1,
    "signature_url": null,
    "createdAt": "2026-05-13T10:30:00.000Z",
    "updatedAt": "2026-05-13T10:30:00.000Z"
  }
}
```

---

### 4. Update Employee
**Endpoint:** `POST /api/employee/update_employee`

**Headers:**
```
Authorization: your_jwt_token_here
Content-Type: application/json
```

**Request Body (Raw JSON):**
```json
{
  "employee_id": 1,
  "name": "John Doe Updated",
  "role_id": 2,
  "email": "john.doe@example.com",
  "mobilenumber": "1234567890",
  "postcode": "12345",
  "address": "123 Main Street Updated",
  "countryid": 1,
  "stateid": 1,
  "cityid": 1,
  "uploadsignatureimg": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Employee updated successfully",
  "imageUrl": null
}
```

---

### 5. Update Employee Status
**Endpoint:** `POST /api/employee/update_employee_status`

**Headers:**
```
Authorization: your_jwt_token_here
Content-Type: application/json
```

**Request Body (Raw JSON):**
```json
{
  "employee_id": 1,
  "status": 1
}
```
**Note:** `status` values: `1` = Active, `0` = Inactive

**Response:**
```json
{
  "success": true,
  "message": "Employee status updated successfully"
}
```

---

### 6. Delete Employee
**Endpoint:** `POST /api/employee/delete_employee`

**Headers:**
```
Authorization: your_jwt_token_here
Content-Type: application/json
```

**Request Body (Raw JSON):**
```json
{
  "employee_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Employee deleted successfully"
}
```

---

## 👥 Customer APIs

### 1. Create Customer
**Endpoint:** `POST /api/customer/create_customer`

**Headers:**
```
Authorization: your_jwt_token_here
Content-Type: application/json
```

**Request Body (Raw JSON):**
```json
{
  "Prefix": "Mr.",
  "customer_name": "Jane Smith",
  "customer_company_name": "ABC Corp",
  "customer_email": "jane.smith@example.com",
  "customer_number": "9876543210",
  "customer_post_code": "54321",
  "customer_address": "456 Business Ave",
  "customer_country_id": 1,
  "customer_state_id": 1,
  "customer_city_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer created successfully",
  "logo_url": null,
  "logo_icon_url": null
}
```

---

### 2. Customer List
**Endpoint:** `POST /api/customer/customerlist`

**Headers:**
```
Authorization: your_jwt_token_here
Content-Type: application/json
```

**Request Body (Raw JSON):**
```json
{
  "page": 1,
  "limit": 10,
  "search": "",
  "country_id": null
}
```

**Response:**
```json
{
  "success": true,
  "page": 1,
  "limit": 10,
  "total": 3,
  "total_pages": 1,
  "data": [
    {
      "customer_id": 1,
      "Prefix": "Mr.",
      "customer_name": "Jane Smith",
      "customer_company_name": "ABC Corp",
      "customer_email": "jane.smith@example.com",
      "customer_number": "9876543210",
      "customer_post_code": "54321",
      "customer_address": "456 Business Ave",
      "customer_status": 1,
      "customer_country_id": 1,
      "country_name": "USA",
      "customer_state_id": 1,
      "state_name": "California",
      "customer_city_id": 1,
      "city_name": "Los Angeles",
      "customer_company_logo": null,
      "customer_company_logo_icon": null,
      "logo_url": null,
      "logo_icon_url": null,
      "created_at": "2026-05-13T10:30:00.000Z"
    }
  ]
}
```

---

### 3. Get Customer By ID ✨ NEW
**Endpoint:** `POST /api/customer/get_customer_by_id`

**Headers:**
```
Authorization: your_jwt_token_here
Content-Type: application/json
```

**Request Body (Raw JSON):**
```json
{
  "customer_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "customer_id": 1,
    "Prefix": "Mr.",
    "customer_name": "Jane Smith",
    "customer_company_name": "ABC Corp",
    "customer_email": "jane.smith@example.com",
    "customer_number": "9876543210",
    "customer_post_code": "54321",
    "customer_address": "456 Business Ave",
    "customer_status": 1,
    "customer_country_id": 1,
    "country_name": "USA",
    "customer_state_id": 1,
    "state_name": "California",
    "customer_city_id": 1,
    "city_name": "Los Angeles",
    "customer_company_logo": null,
    "customer_company_logo_icon": null,
    "created_by_id": 1,
    "logo_url": null,
    "logo_icon_url": null,
    "created_at": "2026-05-13T10:30:00.000Z",
    "updated_at": "2026-05-13T10:30:00.000Z"
  }
}
```

---

### 4. Update Customer ✨ NEW
**Endpoint:** `POST /api/customer/update_customer`

**Headers:**
```
Authorization: your_jwt_token_here
Content-Type: application/json
```

**Request Body (Raw JSON):**
```json
{
  "customer_id": 1,
  "Prefix": "Mrs.",
  "customer_name": "Jane Smith Updated",
  "customer_company_name": "ABC Corp Updated",
  "customer_email": "jane.smith@example.com",
  "customer_number": "9876543210",
  "customer_post_code": "54321",
  "customer_address": "456 Business Ave Updated",
  "customer_country_id": 1,
  "customer_state_id": 1,
  "customer_city_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer updated successfully",
  "logo_url": null,
  "logo_icon_url": null
}
```

---

### 5. Update Customer Status
**Endpoint:** `POST /api/customer/update_customer_status`

**Headers:**
```
Authorization: your_jwt_token_here
Content-Type: application/json
```

**Request Body (Raw JSON):**
```json
{
  "customer_id": 1,
  "status": 1
}
```
**Note:** `status` values: `1` = Active, `0` = Inactive

**Response:**
```json
{
  "success": true,
  "message": "Customer status updated successfully"
}
```

---

### 6. Delete Customer
**Endpoint:** `POST /api/customer/delete_customer`

**Headers:**
```
Authorization: your_jwt_token_here
Content-Type: application/json
```

**Request Body (Raw JSON):**
```json
{
  "customer_id": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

---

## 🔐 Important Notes

1. **Authentication Required:** All endpoints require a valid JWT token in the Authorization header
2. **created_by_id:** Automatically captured from the authenticated user (req.user.id)
3. **Role Validation:** Employee create/update APIs validate that the role_id exists in the roles table
4. **File Uploads:** For signature images and logos, use multipart/form-data instead of raw JSON
5. **Status Values:** 
   - `1` = Active
   - `0` = Inactive

---

## 📝 Postman Setup Instructions

1. Import the `Postman_API_Collection.json` file into Postman
2. Set the environment variables:
   - `base_url`: Your server URL (e.g., http://localhost:3000)
   - `token`: Your JWT authentication token
3. All requests are configured with proper headers and body examples
4. Use "Body > raw > JSON" format for all POST requests

---

## ✨ New Features Added

### Employee APIs:
- ✅ `created_by_id` field added to create and update
- ✅ Role reference validation (checks if role_id exists)
- ✅ **NEW:** Get Employee By ID API

### Customer APIs:
- ✅ `Prefix` field added to create and update
- ✅ `created_by_id` field added to create and update
- ✅ **NEW:** Get Customer By ID API
- ✅ **NEW:** Update Customer API (complete implementation)

---

## 🚀 Testing the APIs

### Step 1: Get Authentication Token
First, login to get your JWT token using your auth API.

### Step 2: Set Token in Postman
Add the token to the Authorization header or use Postman environment variables.

### Step 3: Test the APIs
Use the raw JSON examples provided above in Postman's Body > raw > JSON section.

---

## 📊 Database Fields

### Employee (users table):
- `id`, `name`, `role_id`, `email`, `mobile_number`, `postcode`, `address`
- `countryid`, `stateid`, `cityid`, `uploadsignatureimg`
- `created_by_id` ✨ NEW
- `status`, `createdAt`, `updatedAt`

### Customer (customer table):
- `customer_id`, `Prefix` ✨ NEW, `customer_name`, `customer_company_name`
- `customer_email`, `customer_number`, `customer_post_code`, `customer_address`
- `customer_country_id`, `customer_state_id`, `customer_city_id`
- `customer_company_logo`, `customer_company_logo_icon`
- `created_by_id` ✨ NEW
- `customer_status`, `created_at`, `updated_at`
