# Building Management - Quick Start Guide

## ✅ Installation Complete!

All files have been created and configured. Follow these steps to get started:

## 1️⃣ Database Setup

Run this SQL query in your MySQL database:

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

-- Add indexes for better performance
CREATE INDEX idx_customer_id ON building_management(customer_id);
CREATE INDEX idx_status ON building_management(status);
CREATE INDEX idx_created_by ON building_management(created_by_id);
```

Or run the SQL file:
```bash
mysql -u your_username -p your_database < database/building_management.sql
```

## 2️⃣ Start the Server

```bash
npm run dev
```

## 3️⃣ Test the API

### Get JWT Token First
Login using your existing auth endpoint to get a JWT token.

### Test Building Creation
```bash
curl -X POST http://localhost:5000/api/building/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "customer_id": 1,
    "building_name": "Main Office Building",
    "postcode": "380001",
    "country_id": 1,
    "state_id": 5,
    "city_id": 10,
    "address": "123 Business Park, Sector 5",
    "landmark": "Near City Mall",
    "status": "active"
  }'
```

### Get All Buildings
```bash
curl http://localhost:5000/api/building/list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Generate QR Code
```bash
curl http://localhost:5000/api/building/qrcode/generate/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Print QR Code
Open in browser:
```
http://localhost:5000/api/building/qrcode/print/1
```

## 4️⃣ API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/building/create` | POST | Create building |
| `/api/building/list` | GET | List all buildings |
| `/api/building/edit/:id` | GET | Get building by ID |
| `/api/building/update/:id` | PUT | Update building |
| `/api/building/delete/:id` | DELETE | Delete building |
| `/api/building/qrcode/generate/:id` | GET | Generate QR code |
| `/api/building/qrcode/print/:id` | GET | Print QR code |
| `/api/building/qrcode/image/:id` | GET | Get QR image |

## 5️⃣ Files Created

✅ **Controller**: `controllers/buildingController.js`
- All CRUD operations
- QR code generation
- QR code printing
- Complete error handling

✅ **Routes**: `routes/buildingRoutes.js`
- All API endpoints
- Authentication middleware

✅ **Database**: `database/building_management.sql`
- Table creation script
- Indexes for performance

✅ **Documentation**:
- `API_Documentation_Building.md` - Complete API docs
- `README_Building_Management.md` - Full implementation guide
- `QUICK_START_BUILDING.md` - This file
- `Postman_Building_API_Collection.json` - Postman collection

✅ **Dependencies**: 
- `qrcode` package installed ✓
- `uploads/qrcodes/` directory created ✓

✅ **Server Configuration**:
- Routes added to `server.js` ✓

## 6️⃣ Frontend Integration Example

### HTML Table with QR Icons

```html
<table class="table">
  <thead>
    <tr>
      <th>Building Name</th>
      <th>Customer</th>
      <th>Postcode</th>
      <th>Country</th>
      <th>City</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody id="buildingTableBody">
    <!-- Data will be populated here -->
  </tbody>
</table>
```

### JavaScript to Load Buildings

```javascript
async function loadBuildings() {
  try {
    const response = await fetch('http://localhost:5000/api/building/list', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      const tbody = document.getElementById('buildingTableBody');
      tbody.innerHTML = '';
      
      result.data.forEach(building => {
        const row = `
          <tr>
            <td>${building.building_name}</td>
            <td>${building.customer_name || 'N/A'}</td>
            <td>${building.postcode || 'N/A'}</td>
            <td>${building.country_id || 'N/A'}</td>
            <td>${building.city_id || 'N/A'}</td>
            <td>
              <!-- QR Generate Icon -->
              <button onclick="generateQR(${building.building_id})" 
                      class="btn btn-sm btn-info" 
                      title="Generate QR Code">
                <i class="fas fa-qrcode"></i>
              </button>
              
              <!-- QR Print Icon -->
              <button onclick="printQR(${building.building_id})" 
                      class="btn btn-sm btn-secondary" 
                      title="Print QR Code">
                <i class="fas fa-print"></i>
              </button>
              
              <!-- Edit Icon -->
              <button onclick="editBuilding(${building.building_id})" 
                      class="btn btn-sm btn-primary" 
                      title="Edit">
                <i class="fas fa-edit"></i>
              </button>
              
              <!-- Delete Icon -->
              <button onclick="deleteBuilding(${building.building_id})" 
                      class="btn btn-sm btn-danger" 
                      title="Delete">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
        tbody.innerHTML += row;
      });
    }
  } catch (error) {
    console.error('Error loading buildings:', error);
  }
}

// Generate QR Code
async function generateQR(buildingId) {
  try {
    const response = await fetch(
      `http://localhost:5000/api/building/qrcode/generate/${buildingId}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    const data = await response.json();
    
    if (data.success) {
      // Show QR code in modal or new window
      const qrWindow = window.open('', 'QR Code', 'width=500,height=600');
      qrWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${data.data.buildingInfo.building_name}</title>
            <style>
              body { text-align: center; padding: 20px; font-family: Arial; }
              img { max-width: 400px; margin: 20px; }
              .info { text-align: left; max-width: 400px; margin: 0 auto; }
            </style>
          </head>
          <body>
            <h2>${data.data.buildingInfo.building_name}</h2>
            <img src="${data.data.qrCode}" alt="QR Code" />
            <div class="info">
              <p><strong>Customer:</strong> ${data.data.buildingInfo.customer_name}</p>
              <p><strong>Address:</strong> ${data.data.buildingInfo.address}</p>
              <p><strong>Postcode:</strong> ${data.data.buildingInfo.postcode}</p>
            </div>
            <button onclick="window.print()">Print</button>
          </body>
        </html>
      `);
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to generate QR code');
  }
}

// Print QR Code
function printQR(buildingId) {
  window.open(
    `http://localhost:5000/api/building/qrcode/print/${buildingId}`,
    '_blank',
    'width=800,height=600'
  );
}

// Edit Building
function editBuilding(buildingId) {
  window.location.href = `/edit-building.html?id=${buildingId}`;
}

// Delete Building
async function deleteBuilding(buildingId) {
  if (!confirm('Are you sure you want to delete this building?')) {
    return;
  }
  
  try {
    const response = await fetch(
      `http://localhost:5000/api/building/delete/${buildingId}`,
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
      loadBuildings(); // Reload the list
    } else {
      alert('Error: ' + data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to delete building');
  }
}

// Load buildings on page load
document.addEventListener('DOMContentLoaded', loadBuildings);
```

## 7️⃣ Testing with Postman

1. Import the collection: `Postman_Building_API_Collection.json`
2. Set environment variables:
   - `base_url`: http://localhost:5000
   - `token`: Your JWT token from login
3. Test all endpoints in order:
   - Create Building
   - Get All Buildings
   - Get Building by ID
   - Update Building
   - Generate QR Code
   - Print QR Code
   - Delete Building

## 8️⃣ QR Code Features

### What's in the QR Code?
The QR code contains complete building information in JSON format:
- Building ID
- Building Name
- Customer Information
- Address Details
- Location IDs (Country, State, City)
- Postcode
- Landmark
- Status
- Creation Date

### QR Code Usage
1. **Generate**: Creates QR code and returns base64 image
2. **Print**: Opens formatted HTML page for printing
3. **Image**: Returns PNG file for display in tables

### QR Code Storage
- Stored in: `uploads/qrcodes/`
- Filename format: `building_1.png`
- Auto-generated if not exists
- Deleted when building is deleted

## 9️⃣ Common Issues & Solutions

### Issue: "Cannot find module 'qrcode'"
**Solution**: Run `npm install qrcode`

### Issue: "Table doesn't exist"
**Solution**: Run the SQL script in `database/building_management.sql`

### Issue: "Unauthorized"
**Solution**: Make sure you're sending the JWT token in the Authorization header

### Issue: "QR code directory not found"
**Solution**: The directory is auto-created, but you can manually create it:
```bash
mkdir -p uploads/qrcodes
```

## 🎉 You're All Set!

The Building Management module is ready to use with:
- ✅ Complete CRUD operations
- ✅ QR code generation with all building info
- ✅ QR code printing functionality
- ✅ Search and filtering
- ✅ Pagination support
- ✅ Full authentication
- ✅ Error handling
- ✅ Complete documentation

For detailed API documentation, see: `API_Documentation_Building.md`
