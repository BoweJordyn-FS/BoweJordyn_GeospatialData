# BoweJordyn — Geospatial Data API

A Node.js/Express application that fetches live weather data from **OpenWeatherMap** by geographic coordinates and stores results in **MongoDB**.

---

## API Used

**OpenWeatherMap — Current Weather Data**

- Endpoint: `https://api.openweathermap.org/data/2.5/weather`
- Docs: https://openweathermap.org/current
- Auth: API key passed as `appid` query parameter
- An API key is required. Sign up at https://openweathermap.org/api to obtain one.

---

## Setup

- MongoDB running locally (default: `mongodb://127.0.0.1:27017`)

### Install dependencies

```bash
npm install
```

### Configure env

Create a `.env` file in the project root (a sample is included):

```
MONGODB_URI=mongodb://127.0.0.1:27017/WeatherApp
OPENWEATHER_API_KEY=your_api_key_here
PORT=3003
```

### Run the server

```bash

npm start


npm run dev
```

The server starts on `http://localhost:3003` by default.

---

## Routes

| Method | Route                     | Description                                                  |
| ------ | ------------------------- | ------------------------------------------------------------ |
| `GET`  | `/`                       | Root health check                                            |
| `GET`  | `/api/geo-data`           | Health check for geo-data base path                          |
| `GET`  | `/api/geo-data?lat=&lon=` | Fetch live weather from OpenWeatherMap for given coordinates |
| `POST` | `/api/geo-data`           | Save geospatial weather data to MongoDB                      |
| `GET`  | `/api/geo-data`           | Retrieve all stored records (no coordinates query params)    |
| `GET`  | `/api/geo-data/:id`       | Retrieve a single stored record by MongoDB document ID       |

---

## Route Details

### `GET /api/geo-data?lat=&lon=`

Fetches current weather from OpenWeatherMap. Returns the raw API response. Does **not** automatically save to the database.

**Query parameters:**

| Param | Type   | Required | Description             |
| ----- | ------ | -------- | ----------------------- |
| `lat` | number | Yes      | Latitude (-90 to 90)    |
| `lon` | number | Yes      | Longitude (-180 to 180) |

**Example:**

```
GET /api/geo-data?lat=40.7128&lon=-74.0060
```

**Rate limit:** 10 external API calls per minute per IP address.

---

### `POST /api/geo-data`

Saves geospatial weather data to MongoDB. Returns the saved document ID.

**Request body (JSON):**

| Field         | Type   | Required | Description                   |
| ------------- | ------ | -------- | ----------------------------- |
| `lat`         | number | Yes      | Latitude                      |
| `lon`         | number | Yes      | Longitude                     |
| `location`    | string | Yes      | City or place name            |
| `temperature` | number | Yes      | Temperature in °F             |
| `humidity`    | number | Yes      | Humidity percentage           |
| `windSpeed`   | number | Yes      | Wind speed in mph             |
| `feelsLike`   | number | No       | Feels-like temperature        |
| `description` | string | No       | Weather condition description |
| `country`     | string | No       | Country code                  |

**Example:**

```json
{
	"lat": 40.7128,
	"lon": -74.006,
	"location": "New York",
	"country": "US",
	"temperature": 72.5,
	"feelsLike": 70.1,
	"humidity": 65,
	"windSpeed": 8.2,
	"description": "clear sky"
}
```

---

### `GET /api/geo-data` (no lat/lon params)

Returns all stored weather records from MongoDB, sorted by fetch date descending.

**Optional query parameters:**

| Param       | Type                 | Description                           |
| ----------- | -------------------- | ------------------------------------- |
| `startDate` | ISO 8601 date string | Filter records on or after this date  |
| `endDate`   | ISO 8601 date string | Filter records on or before this date |

**Example:**

```
GET /api/geo-data?startDate=2024-01-01&endDate=2024-12-31
```

---

### `GET /api/geo-data/:id`

Retrieves a single stored weather record by its MongoDB document ID.

**Example:**

```
GET /api/geo-data/64f1a2b3c4d5e6f7a8b9c0d1
```

## Error Responses

| Status | Meaning                                                    |
| ------ | ---------------------------------------------------------- |
| `400`  | Bad request — missing or invalid parameters                |
| `404`  | Record not found                                           |
| `429`  | Rate limit exceeded (max 10 external API calls/min per IP) |
| `500`  | Internal server error                                      |
