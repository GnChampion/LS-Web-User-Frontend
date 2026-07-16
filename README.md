# Land Scanner - User Web App

Web application for end-users to monitor their land zones and satellite imagery.

## Features

- 🔐 Firebase Authentication (separate project)
- 📍 View assigned land zones
- 🛰️ Browse satellite images
- 📝 Request new zones
- 👤 User profile & tier management

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` with your Firebase config and backend URL.

### 3. Run Development Server
```bash
npm run dev
```

Opens at: http://localhost:3001

## Build for Production

```bash
npm run build
```

## Deploy to Firebase Hosting

```bash
npm run deploy
```

## Project Structure

```
src/
├── components/       # Reusable Vue components
├── views/            # Page components
├── stores/           # Pinia state management
├── services/         # API & Firebase services
├── router/           # Vue Router config
├── types/            # TypeScript types
├── assets/           # Images, icons
└── main.ts           # Entry point
```

## Authentication Flow

1. User registers/logs in via Firebase Auth (separate project)
2. Firebase returns auth token
3. Token is sent to backend API for data access
4. Backend verifies token and returns user data from main Firestore

## Tech Stack

- **Vue 3** - Progressive framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Pinia** - State management
- **Vue Router** - Routing
- **Firebase Auth** - Authentication
- **Axios** - HTTP client

## License

Proprietary
