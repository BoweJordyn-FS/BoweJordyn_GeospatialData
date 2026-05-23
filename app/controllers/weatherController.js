const WeatherData = require('../models/WeatherData');

const OPENWEATHER_BASE = 'https://api.openweathermap.org/data/2.5/weather';

// Simple in-memory rate limiter: max 10 external API calls per minute per IP
const rateLimitMap = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;

function isRateLimited(ip) {
	const now = Date.now();
	const entry = rateLimitMap.get(ip);

	if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
		rateLimitMap.set(ip, { count: 1, windowStart: now });
		return false;
	}

	if (entry.count >= RATE_LIMIT) {
		return true;
	}

	entry.count += 1;
	return false;
}

/**
 * GET /api/geo-data?lat=&lon=
 * If lat/lon query params are provided, fetches live weather data from
 * OpenWeatherMap and returns it to the client (does NOT save automatically).
 * If no lat/lon params, returns all stored documents from MongoDB.
 */
const getGeoData = async (req, res) => {
	const { lat, lon, startDate, endDate } = req.query;

	// Fetch from external API when coordinates are supplied
	if (lat || lon) {
		if (!lat || !lon) {
			return res.status(400).json({
				success: false,
				message: 'Both lat and lon query parameters are required.',
			});
		}

		const parsedLat = parseFloat(lat);
		const parsedLon = parseFloat(lon);

		if (isNaN(parsedLat) || isNaN(parsedLon)) {
			return res
				.status(400)
				.json({
					success: false,
					message: 'lat and lon must be valid numbers.',
				});
		}

		if (
			parsedLat < -90 ||
			parsedLat > 90 ||
			parsedLon < -180 ||
			parsedLon > 180
		) {
			return res.status(400).json({
				success: false,
				message: 'lat must be between -90 and 90; lon between -180 and 180.',
			});
		}

		// Enforce rate limit on external API calls
		const clientIp = req.ip || req.connection.remoteAddress;
		if (isRateLimited(clientIp)) {
			return res.status(429).json({
				success: false,
				message: 'Too many requests. Maximum 10 external API calls per minute.',
			});
		}

		const apiKey = process.env.OPENWEATHER_API_KEY;
		const url = `${OPENWEATHER_BASE}?lat=${parsedLat}&lon=${parsedLon}&appid=${apiKey}&units=imperial`;

		try {
			const response = await fetch(url);

			if (!response.ok) {
				const errorData = await response.json();
				return res.status(response.status).json({
					success: false,
					message: errorData.message || 'OpenWeatherMap API error.',
				});
			}

			const data = await response.json();
			return res.status(200).json({ success: true, data });
		} catch (error) {
			return res
				.status(500)
				.json({
					success: false,
					message: `Failed to fetch weather data: ${error.message}`,
				});
		}
	}

	// No coordinates — return all stored records with optional date filters
	try {
		const filter = {};

		if (startDate || endDate) {
			filter.fetchedAt = {};
			if (startDate) filter.fetchedAt.$gte = new Date(startDate);
			if (endDate) filter.fetchedAt.$lte = new Date(endDate);
		}

		const records = await WeatherData.find(filter).sort({ fetchedAt: -1 });
		return res
			.status(200)
			.json({ success: true, count: records.length, data: records });
	} catch (error) {
		return res
			.status(500)
			.json({
				success: false,
				message: `Failed to retrieve data: ${error.message}`,
			});
	}
};

/**
 * POST /api/geo-data
 * Accepts geospatial weather data in the request body and saves it to MongoDB.
 * Expected: { lat, lon, location, temperature, feelsLike, humidity, windSpeed, description, country }
 */
const saveGeoData = async (req, res) => {
	const {
		lat,
		lon,
		location,
		temperature,
		feelsLike,
		humidity,
		windSpeed,
		description,
		country,
	} = req.body;

	if (
		!lat ||
		!lon ||
		!location ||
		temperature == null ||
		humidity == null ||
		windSpeed == null
	) {
		return res.status(400).json({
			success: false,
			message:
				'Required fields: lat, lon, location, temperature, humidity, windSpeed.',
		});
	}

	try {
		const record = await WeatherData.create({
			coordinates: { lat: parseFloat(lat), lon: parseFloat(lon) },
			location,
			country,
			temperature: parseFloat(temperature),
			feelsLike: feelsLike != null ? parseFloat(feelsLike) : undefined,
			humidity: parseFloat(humidity),
			windSpeed: parseFloat(windSpeed),
			description,
			fetchedAt: new Date(),
		});

		return res.status(201).json({
			success: true,
			message: 'Geospatial data saved successfully.',
			id: record._id,
			data: record,
		});
	} catch (error) {
		return res
			.status(500)
			.json({
				success: false,
				message: `Failed to save data: ${error.message}`,
			});
	}
};

/**
 * GET /api/geo-data/:id
 * Gets a single geospatial data entry from MongoDB by its document ID.
 */
const getGeoDataById = async (req, res) => {
	const { id } = req.params;

	try {
		const record = await WeatherData.findById(id);

		if (!record) {
			return res
				.status(404)
				.json({ success: false, message: `No record found with id: ${id}` });
		}

		return res.status(200).json({ success: true, data: record });
	} catch (error) {
		// Mongoose throws a CastError for malformed ObjectIds
		if (error.name === 'CastError') {
			return res
				.status(400)
				.json({ success: false, message: `Invalid id format: ${id}` });
		}
		return res
			.status(500)
			.json({
				success: false,
				message: `Failed to retrieve record: ${error.message}`,
			});
	}
};

module.exports = { getGeoData, saveGeoData, getGeoDataById };
