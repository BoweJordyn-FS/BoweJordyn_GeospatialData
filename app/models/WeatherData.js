const mongoose = require('mongoose');

// Schema for storing geospatial weather data retrieved from OpenWeatherMap
const weatherDataSchema = new mongoose.Schema(
	{
		coordinates: {
			lat: { type: Number, required: true },
			lon: { type: Number, required: true },
		},
		location: {
			type: String,
			required: true,
		},
		country: {
			type: String,
		},
		temperature: {
			type: Number,
			required: true,
		},
		feelsLike: {
			type: Number,
		},
		humidity: {
			type: Number,
			required: true,
		},
		windSpeed: {
			type: Number,
			required: true,
		},
		description: {
			type: String,
		},
		fetchedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

const WeatherData = mongoose.model('WeatherData', weatherDataSchema);

module.exports = WeatherData;
