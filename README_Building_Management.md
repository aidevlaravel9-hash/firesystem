# Building Management Module

Complete Building Management system with CRUD operations and QR Code generation/printing functionality.

## Features

✅ **Complete CRUD Operations**
- Create new buildings
- List all buildings with pagination and search
- Get building details by ID for editing
- Update existing buildings
- Delete buildings

✅ **QR Code Functionality**
- Generate QR codes with complete building information
- Store QR codes as image files
- Print QR codes with building details
- Display QR codes in listing table

✅ **Advanced Features**
- Search by building name, postcode, or address
- Filter by status (active/inactive)
- Filter by customer
- Pagination support
- Authentication required for all endpoints
- Automatic QR code generation if not exists

## Database Schema

### Table: `building_management`

```sql
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
```

## Installation

### 1. Install Dependencies
```bash
npm install qrcode
```

### 2. Create Database Table
Run the SQL script located in `database/building_management.sql`:
```bash
mysql -u your_username -p your_database < database/building_management.sql
```

Or execute the SQL directly in your MySQL client.

### 3. Create QR Code Directory
```bash
mkdir -p uploads/qrcodes
```

### 4. Server Configuration
The routes are already added to `server.js`:
```javascript
app.use("/api/building", require("./routes/buildingRoutes"));
```

## API Endpoints

### Base URL: `/api/building`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create` | Create a new building |
| GET | `/list` | Get all buildings with pagination |
| GET | `/edit/:id` | Get building by ID for editing |
| PUT | `/update/:id` | Update building |
| DELETE | `/delete/:id` | Delete building |
| GET | `/qrcode/generate/:id` | Generate QR code |
| GET | `/qrcode/print/:id` | Print QR code (HTML page) |
| GET | `/qrcode/image/:id` | Get QR code image |

## Usage Examples

### 1. Create Building
```javascript
const response = await fetch('http://localhost:5000/api/building/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    customer_id: 1,
    building_name: 'Main Office Building',
    postcode: '380001',
    country_id: 1,
    state_id: 5,
    city_id: 10,
    address: '123 Business Park, Sector 5',
    landmark: 'Near City Mall',
    status: 'active'
  })
});
```

### 2. Get All Buildings
```javascript
const response = await fetch(
  'http://localhost:5000/api/building/list?page=1&limit=10&search=office',
  {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  }
);
```

### 3. Generate QR Code
```javascript
const response = await fetch(
  'http://localhost:5000/api/building/qrcode/generate/1',
  {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  }
);
const data = await response.json();
// data.data.qrCode contains base64 image
// data.data.qrFilePath contains file path
```

### 4. Print QR Code
```javascript
// Open in new window for printing
window.open(
  'http://localhost:5000/api/building/qrcode/print/1',
  '_blank',
  'width=800,height=600'
);
```

## Frontend Integration

### Display QR Icons in Listing Table

```html
<table>
  <thead>
    <tr>
      <th>Building Name</th>
      <th>Customer</th>
      <th>Postcode</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Main Office Building</td>
      <td>ABC Corp</td>
      <td>380001</td>
      <td>
        <!-- QR Generate Icon -->
        <button onclick="generateQR(1)" title="Generate QR Code">
          <i class="fas fa-qrcode"></i>
        </button>
        
        <!-- QR Print Icon -->
        <button onclick="printQR(1)" title="Print QR Code">
          <i class="fas fa-print"></i>
        </button>
        
        <!-- Edit Icon -->
        <button onclick="editBuilding(1)" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        
        <!-- Delete Icon -->
        <button onclick="deleteBuilding(1)" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  </tbody>
</table>
```

### JavaScript Functions

```javascript
// Generate and display QR code
async function generateQR(buildingId) {
  try {
    const response = await fetch(
      `/api/building/qrcode/generate/${buildingId}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      // Show QR code in modal
      const modal = document.getElementById('qrModal');
      const qrImage = document.getElementById('qrImage');
      qrImage.src = data.data.qrCode;
      modal.style.display = 'block';
      
      // Display building info
      document.getElementById('buildingInfo').innerHTML = `
        <h3>${data.data.buildingInfo.building_name}</h3>
        <p><strong>Customer:</strong> ${data.data.buildingInfo.customer_name}</p>
        <p><strong>Address:</strong> ${data.data.buildingInfo.address}</p>
        <p><strong>Postcode:</strong> ${data.data.buildingInfo.postcode}</p>
      `;
    } else {
      alert('Error generating QR code: ' + data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to generate QR code');
  }
}

// Print QR code
function printQR(buildingId) {
  const token = localStorage.getItem('token');
  const printWindow = window.open(
    `/api/building/qrcode/print/${buildingId}`,
    '_blank',
    'width=800,height=600'
  );
}

// Edit building
function editBuilding(buildingId) {
  window.location.href = `/edit-building.html?id=${buildingId}`;
}

// Delete building
async function deleteBuilding(buildingId) {
  if (!confirm('Are you sure you want to delete this building?')) {
    return;
  }
  
  try {
    const response = await fetch(
      `/api/building/delete/${buildingId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      alert('Building deleted successfully');
      location.reload();
    } else {
      alert('Error deleting building: ' + data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to delete building');
  }
}
```

### QR Code Modal HTML

```html
<!-- QR Code Modal -->
<div id="qrModal" class="modal">
  <div class="modal-content">
    <span class="close" onclick="closeQRModal()">&times;</span>
    <h2>Building QR Code</h2>
    <div id="buildingInfo"></div>
    <img id="qrImage" alt="QR Code" style="max-width: 400px; margin: 20px auto; display: block;">
    <div style="text-align: center; margin-top: 20px;">
      <button onclick="downloadQR()">Download QR Code</button>
      <button onclick="printQRFromModal()">Print QR Code</button>
    </div>
  </div>
</div>

<style>
.modal {
  display: none;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
}

.modal-content {
  background-color: #fefefe;
  margin: 5% auto;
  padding: 30px;
  border: 1px solid #888;
  border-radius: 10px;
  width: 80%;
  max-width: 600px;
}

.close {
  color: #aaa;
  float: right;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
}

.close:hover {
  color: #000;
}
</style>

<script>
function closeQRModal() {
  document.getElementById('qrModal').style.display = 'none';
}

function downloadQR() {
  const qrImage = document.getElementById('qrImage');
  const link = document.createElement('a');
  link.href = qrImage.src;
  link.download = 'building_qrcode.png';
  link.click();
}

function printQRFromModal() {
  const qrImage = document.getElementById('qrImage').src;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head><title>Print QR Code</title></head>
      <body style="text-align: center; padding: 20px;">
        <img src="${qrImage}" style="max-width: 500px;">
        <script>window.print();</script>
      </body>
    </html>
  `);
}
</script>
```

## QR Code Data Structure

The QR code contains complete building information in JSON format:

```json
{
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
```

## File Structure

```
project/
├── controllers/
│   └── buildingController.js       # All building operations
├── routes/
│   └── buildingRoutes.js           # API routes
├── database/
│   └── building_management.sql     # Database schema
├── uploads/
│   └── qrcodes/                    # QR code storage
│       └── building_1.png
├── API_Documentation_Building.md   # Complete API docs
├── Postman_Building_API_Collection.json  # Postman collection
└── README_Building_Management.md   # This file
```

## Testing

### Using Postman
1. Import `Postman_Building_API_Collection.json`
2. Set environment variables:
   - `base_url`: http://localhost:5000
   - `token`: Your JWT token
3. Test all endpoints

### Manual Testing
1. Start the server: `npm run dev`
2. Login to get JWT token
3. Use the token in Authorization header
4. Test each endpoint using Postman or curl

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (in development)"
}
```

## Security

- All endpoints require JWT authentication
- SQL injection prevention using parameterized queries
- Input validation on required fields
- File system security for QR code storage

## Notes

- QR codes are automatically generated if they don't exist when accessed
- QR codes are deleted when building is deleted
- Print endpoint returns a formatted HTML page optimized for printing
- The listing endpoint supports search, filtering, and pagination
- Status can be 'active' or 'inactive'
- All timestamps are automatically managed by the database

## Support

For issues or questions, please refer to:
- API Documentation: `API_Documentation_Building.md`
- Postman Collection: `Postman_Building_API_Collection.json`
