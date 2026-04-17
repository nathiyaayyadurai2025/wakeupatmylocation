# 🚆 WakeMyStop: Elite Travel Mission Control

WakeMyStop is an aerospace-grade travel alert platform designed to ensure you never miss your stop, whether you travel by **Train**, **Bus**, or **General GPS**.

## 🚀 1-Click Production Launch (Vercel)

The ecosystem is now **100% Production-Calibrated**. To deploy to the cloud:

1.  **Authorize Vercel CLI**:
    ```bash
    npx vercel login
    ```
2.  **Launch Mission**:
    ```bash
    npx vercel
    ```
3.  **Go Global**:
    Set the following **Environment Variables** in your Vercel Dashboard:
    - `MONGODB_URI`: Your production MongoDB connection string.
    - `NODE_ENV`: `production`

## ⚙️ Local Development Setup

To run this project locally, you need a MongoDB database:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your `MONGODB_URI` connection string.
3. Start the application:
   ```bash
   npm run dev
   ```

## 💎 Elite Feature Set
- **Satellite Resilience**: 100% mission-robust tracking with automatic "Urban Fallback" if GPS is lost.
- **Progress Engineering**: Real-time visual route tracking (`███░░ 60%`).
- **Safety Vector Detection**: Automatic "Missed Stop" detection with emergency alerts.
- **Adaptive Polling**: Smart battery optimization scaled by distance.
- **PWA Ready**: Installable on Home Screen for superior location persistence.

## 🛠️ Performance Tech Stack
- **Frontend**: React + Vite + Framer Motion (Aerospace Visualization).
- **Backend**: Node.js + Express + Vercel Functions (Serverless Heartbeat).
- **Navigation**: Geolocation API (SPS Precision) + Leaflet (Cartographic Sync).

## 🛡️ Mission Security & Stability
- **Environment Isolation**: Secure `.env` handling for API credentials.
- **Vercel Shield**: Serverless architecture redundant across global regions.
- **Fail-Safe Mode**: Automatic fallback to local constants if API heartbeat is lost.

**Your destination is our mission.**
© 2026 WakeMyStop. 📡 **Sync Status**: [ONLINE] Production-Grade & Fully Synchronized.
