/**
 * Building Management API Test Script
 * 
 * This script tests all Building Management endpoints
 * Run with: node test_building_api.js
 * 
 * Prerequisites:
 * 1. Server must be running (npm run dev)
 * 2. Database table must be created
 * 3. You must have a valid JWT token
 */

const BASE_URL = 'http://localhost:5000';
let TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with your actual token
let createdBuildingId = null;

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TOKEN}`
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, options);
        const data = await response.json();
        return { status: response.status, data };
    } catch (error) {
        return { status: 500, error: error.message };
    }
}

// Test functions
async function test1_CreateBuilding() {
    console.log('\n📝 Test 1: Create Building');
    console.log('=' .repeat(50));
    
    const buildingData = {
        customer_id: 1,
        building_name: 'Test Building - Main Office',
        postcode: '380001',
        country_id: 1,
        state_id: 5,
        city_id: 10,
        address: '123 Test Street, Business Park',
        landmark: 'Near Test Mall',
        status: 'active'
    };

    const result = await apiCall('/api/building/create', 'POST', buildingData);
    
    if (result.data.success) {
        createdBuildingId = result.data.data.building_id;
        console.log('✅ SUCCESS: Building created');
        console.log(`   Building ID: ${createdBuildingId}`);
    } else {
        console.log('❌ FAILED:', result.data.message);
    }
    
    return result;
}

async function test2_GetAllBuildings() {
    console.log('\n📋 Test 2: Get All Buildings');
    console.log('=' .repeat(50));
    
    const result = await apiCall('/api/building/list?page=1&limit=10');
    
    if (result.data.success) {
        console.log('✅ SUCCESS: Buildings retrieved');
        console.log(`   Total buildings: ${result.data.pagination.total}`);
        console.log(`   Buildings on this page: ${result.data.data.length}`);
    } else {
        console.log('❌ FAILED:', result.data.message);
    }
    
    return result;
}

async function test3_GetBuildingById() {
    console.log('\n🔍 Test 3: Get Building by ID');
    console.log('=' .repeat(50));
    
    if (!createdBuildingId) {
        console.log('⚠️  SKIPPED: No building ID available');
        return;
    }
    
    const result = await apiCall(`/api/building/edit/${createdBuildingId}`);
    
    if (result.data.success) {
        console.log('✅ SUCCESS: Building retrieved');
        console.log(`   Building Name: ${result.data.data.building_name}`);
        console.log(`   Address: ${result.data.data.address}`);
    } else {
        console.log('❌ FAILED:', result.data.message);
    }
    
    return result;
}

async function test4_UpdateBuilding() {
    console.log('\n✏️  Test 4: Update Building');
    console.log('=' .repeat(50));
    
    if (!createdBuildingId) {
        console.log('⚠️  SKIPPED: No building ID available');
        return;
    }
    
    const updateData = {
        customer_id: 1,
        building_name: 'Test Building - Main Office (Updated)',
        postcode: '380002',
        country_id: 1,
        state_id: 5,
        city_id: 10,
        address: '123 Test Street, Business Park, Updated Address',
        landmark: 'Near Test Mall',
        status: 'active'
    };

    const result = await apiCall(`/api/building/update/${createdBuildingId}`, 'PUT', updateData);
    
    if (result.data.success) {
        console.log('✅ SUCCESS: Building updated');
    } else {
        console.log('❌ FAILED:', result.data.message);
    }
    
    return result;
}

async function test5_GenerateQRCode() {
    console.log('\n📱 Test 5: Generate QR Code');
    console.log('=' .repeat(50));
    
    if (!createdBuildingId) {
        console.log('⚠️  SKIPPED: No building ID available');
        return;
    }
    
    const result = await apiCall(`/api/building/qrcode/generate/${createdBuildingId}`);
    
    if (result.data.success) {
        console.log('✅ SUCCESS: QR Code generated');
        console.log(`   QR File Path: ${result.data.data.qrFilePath}`);
        console.log(`   Building Info in QR: ${result.data.data.buildingInfo.building_name}`);
    } else {
        console.log('❌ FAILED:', result.data.message);
    }
    
    return result;
}

async function test6_SearchBuildings() {
    console.log('\n🔎 Test 6: Search Buildings');
    console.log('=' .repeat(50));
    
    const result = await apiCall('/api/building/list?search=Test&page=1&limit=10');
    
    if (result.data.success) {
        console.log('✅ SUCCESS: Search completed');
        console.log(`   Results found: ${result.data.data.length}`);
    } else {
        console.log('❌ FAILED:', result.data.message);
    }
    
    return result;
}

async function test7_FilterByStatus() {
    console.log('\n🔍 Test 7: Filter by Status');
    console.log('=' .repeat(50));
    
    const result = await apiCall('/api/building/list?status=active&page=1&limit=10');
    
    if (result.data.success) {
        console.log('✅ SUCCESS: Filter applied');
        console.log(`   Active buildings: ${result.data.data.length}`);
    } else {
        console.log('❌ FAILED:', result.data.message);
    }
    
    return result;
}

async function test8_DeleteBuilding() {
    console.log('\n🗑️  Test 8: Delete Building');
    console.log('=' .repeat(50));
    
    if (!createdBuildingId) {
        console.log('⚠️  SKIPPED: No building ID available');
        return;
    }
    
    const result = await apiCall(`/api/building/delete/${createdBuildingId}`, 'DELETE');
    
    if (result.data.success) {
        console.log('✅ SUCCESS: Building deleted');
    } else {
        console.log('❌ FAILED:', result.data.message);
    }
    
    return result;
}

// Main test runner
async function runAllTests() {
    console.log('\n');
    console.log('🚀 Building Management API Test Suite');
    console.log('=' .repeat(50));
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Token: ${TOKEN.substring(0, 20)}...`);
    console.log('=' .repeat(50));

    // Check if token is set
    if (TOKEN === 'YOUR_JWT_TOKEN_HERE') {
        console.log('\n❌ ERROR: Please set your JWT token in the TOKEN variable');
        console.log('   Get your token by logging in through the auth endpoint');
        return;
    }

    try {
        // Run tests in sequence
        await test1_CreateBuilding();
        await test2_GetAllBuildings();
        await test3_GetBuildingById();
        await test4_UpdateBuilding();
        await test5_GenerateQRCode();
        await test6_SearchBuildings();
        await test7_FilterByStatus();
        await test8_DeleteBuilding();

        console.log('\n');
        console.log('=' .repeat(50));
        console.log('✅ All tests completed!');
        console.log('=' .repeat(50));
        console.log('\n');

    } catch (error) {
        console.log('\n❌ Test suite failed:', error.message);
    }
}

// Run tests
runAllTests();
