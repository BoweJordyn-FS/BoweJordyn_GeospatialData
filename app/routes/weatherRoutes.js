const express = require('express');
const router = express.Router();
const { getGeoData, saveGeoData, getGeoDataById } = require('../controllers/weatherController');

// GET /api/geo-data?lat=&lon=  → fetch live data from OpenWeatherMap
// GET /api/geo-data             → return all stored records (optional ?startDate=&endDate= filters)
router.get('/', getGeoData);

// POST /api/geo-data  → save geospatial data to MongoDB
router.post('/', saveGeoData);

// GET /api/geo-data/:id  → retrieve a single stored record by MongoDB ID
router.get('/:id', getGeoDataById);

module.exports = router;
