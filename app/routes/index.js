const express = require('express');
const router = express.Router();
const weatherRoutes = require('./weatherRoutes');

router.get('/', (req, res) => {
	res
		.status(200)
		.json({ message: `${req.method} - Request Made`, success: true });
});

// Mount all weather/geospatial routes directly under /api/geo-data
router.use('/', weatherRoutes);

module.exports = router;
