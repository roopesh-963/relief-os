# ReliefOS AI

Live disaster operations dashboard with:
- Live earthquake monitoring map (USGS feed)
- City-level risk/weather intel (OpenWeather + Google Geocoding)
- Crisis media stream (NewsAPI)
- SOS, resources, analytics, and AI assistant modules

## Run Locally

Prerequisites:
- Node.js 18+
- MongoDB (local or cloud)

1. Install frontend dependencies:
   `npm install`
2. Install backend dependencies:
   `npm --prefix backend install`
3. Create backend env:
   - copy `backend/.env.example` -> `backend/.env`
   - fill the API keys (see below)
4. Create frontend env:
   - copy `.env.example` -> `.env`
   - set `VITE_API_URL=http://localhost:5000/api`
5. Start backend:
   `npm --prefix backend run dev`
6. Start frontend:
   `npm run dev`

Frontend runs on `http://localhost:3000` and backend on `http://localhost:5000`.

## Run with Docker (Single Unified Container)

### 1. Build and Run Single Container
```bash
# Build the unified image (compiles frontend + sets up backend)
docker build -t reliefos-app:latest .

# Run container on port 5000
docker run -d \
  --name reliefos-app \
  -p 5000:5000 \
  -e MONGO_URI="mongodb+srv://..." \
  -e JWT_SECRET="your_jwt_secret" \
  -e DEMO_MODE=true \
  reliefos-app:latest
```
Access the application at: `http://localhost:5000`

### 2. Run with Docker Compose (App + Local MongoDB)
```bash
docker compose up -d --build
```
This automatically starts:
- ReliefOS application on `http://localhost:5000`
- MongoDB service on `localhost:27017`

## CI/CD Deployment with Jenkins

A production-grade `Jenkinsfile` is included for automated build, test, Docker image push, and container deployment:

1. **Prerequisites in Jenkins**:
   - Install **Docker Pipeline** and **Pipeline** plugins.
   - Configure credentials under *Manage Jenkins > Credentials*:
     - `docker-hub-credentials`: Username & Password for Docker Registry.
     - `reliefos-mongo-uri`: Secret text with MongoDB connection string.
     - `reliefos-jwt-secret`: Secret text with JWT secret.
2. **Setup Pipeline**:
   - Create a **New Item** > **Pipeline**.
   - Under *Pipeline definition*, select **Pipeline script from SCM**.
   - SCM: **Git**, enter your repository URL.
   - Script Path: `Jenkinsfile`.
3. **Run Pipeline**:
   - Click **Build with Parameters**.
   - Configure target `APP_PORT` (default `5000`), `DEPLOY_ENV`, and click **Build**.

## Deploy On Vercel

For the deployed auth flow to work, add these server-side environment variables in your Vercel project settings:
- `MONGO_URI` or `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL`

Recommended values:
- `MONGO_URI`: your MongoDB Atlas connection string, for example `mongodb+srv://.../reliefos?retryWrites=true&w=majority`
- `JWT_SECRET`: a long random secret used to sign auth tokens
- `CLIENT_URL`: your production site URL, for example `https://your-project.vercel.app`
- `MONGO_DB_NAME`: optional; defaults to `reliefos`

Optional frontend env:
- `VITE_API_URL`
  Leave this unset when the frontend and API are deployed in the same Vercel project. The app will call `/api` on the current origin automatically.

## API Keys For Real Data

Add these in `backend/.env`:
- `WEATHER_API_KEY` (OpenWeather)
- `NEWS_API_KEY` (NewsAPI)
- `GOOGLE_MAPS_API_KEY` (Google Geocoding API enabled)
- `USGS_EARTHQUAKE_URL` (optional override, defaults to USGS all-day feed)

Notes:
- USGS is public and works without a key by default.
- Weather/news/geocoding will gracefully degrade if keys are missing.
- API keys stay on backend only, not in frontend env.

## New Intel Source Endpoint

`GET /api/intel/sources`

Returns source readiness:
- `weatherEnabled`
- `newsEnabled`
- `geocodingEnabled`
- `usgsFeedUrl`
- `mode` (`live` or `partial`)
