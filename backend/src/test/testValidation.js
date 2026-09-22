const { validateEventInput, validateNearbyQueryParams } = require('../validators/eventValidator');
const { Event } = require('../models/Event');

console.log('==================================================');
console.log('VALIDATING LOCALVIBE GEOJSON & API CONTRACTS');
console.log('==================================================\n');

// Test 1: Valid Mumbai Event Input
const validEvent = {
  title: 'Bandra Farmers Market',
  description: 'Organic produce and fresh sourdough bread',
  category: 'Markets',
  startDate: new Date().toISOString(),
  endDate: new Date(Date.now() + 86400000).toISOString(),
  location: {
    address: 'Carter Road, Bandra West',
    coordinates: [72.8358, 19.0596] // [longitude, latitude]
  },
  price: 0,
  image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=1200&q=80'
};

const v1 = validateEventInput(validEvent);
console.log('Test 1 - Valid Mumbai Event:', v1.isValid ? 'PASS ✅' : 'FAIL ❌');
if (!v1.isValid) console.error(v1.errors);

// Test 1b: Missing Cover Image Rejection
const invalidNoImage = {
  ...validEvent,
  image: ''
};
const v1b = validateEventInput(invalidNoImage);
console.log('Test 1b - Missing Cover Image Rejection:', (!v1b.isValid && v1b.errors.some(e => e.includes('Cover image'))) ? 'PASS ✅' : 'FAIL ❌');
console.log('Validation Errors (Expected):', v1b.errors);

// Test 2: Inverted Coordinates Rejection (Latitude first)
const invalidLatFirst = {
  ...validEvent,
  location: {
    address: 'Test Address',
    coordinates: [19.0596, 200] // Invalid Longitude 200 > 180
  }
};
const v2 = validateEventInput(invalidLatFirst);
console.log('Test 2 - Inverted / Out-of-bounds Coordinates Rejection:', !v2.isValid ? 'PASS ✅' : 'FAIL ❌');
console.log('Validation Errors (Expected):', v2.errors);

// Test 3: End Date Before Start Date Rejection
const invalidDates = {
  ...validEvent,
  startDate: new Date(Date.now() + 86400000).toISOString(),
  endDate: new Date(Date.now()).toISOString()
};
const v3 = validateEventInput(invalidDates);
console.log('Test 3 - End Date Prior to Start Date Rejection:', !v3.isValid ? 'PASS ✅' : 'FAIL ❌');
console.log('Validation Errors (Expected):', v3.errors);

// Test 4: Nearby Search Parameters Validation
const validNearby = { lat: '19.0760', lng: '72.8777', radius: '5' };
const v4 = validateNearbyQueryParams(validNearby);
console.log('Test 4 - Valid Nearby Query Params:', v4.isValid ? 'PASS ✅' : 'FAIL ❌');
console.log('Parsed Nearby Query:', v4.parsed);

console.log('\n==================================================');
console.log('VALIDATION UNIT TESTS COMPLETED SUCCESSFULLY!');
console.log('==================================================');
