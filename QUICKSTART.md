# 🚀 User Web App - Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Firebase project created (separate from admin panel)
- Backend API running

---

## 🔥 Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **"Add project"**
3. Name: `land-scanner-user-app`
4. Create project

---

## 🔐 Step 2: Enable Authentication

1. In Firebase Console → **Authentication**
2. Click **"Get started"**
3. Enable **Email/Password** provider
4. Save

---

## ⚙️ Step 3: Get Firebase Config

1. Project Settings (gear icon) → Your apps
2. Click **Web icon** (</>)
3. Register app: `Land Scanner User App`
4. **Copy the Firebase config**

---

## 📦 Step 4: Install Dependencies

```bash
cd website-userend
npm install
```

---

## 🔧 Step 5: Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your values:

```env
# Your separate Firebase project config
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=land-scanner-user-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=land-scanner-user-app
VITE_FIREBASE_STORAGE_BUCKET=land-scanner-user-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Your backend API URL
VITE_BACKEND_URL=https://land-scanner-backend.onrender.com
# For local development: http://localhost:8000
```

---

## 🎯 Step 6: Run Development Server

```bash
npm run dev
```

Opens at: **http://localhost:3001**

---

## 👥 Step 7: Create Test Users

In Firebase Console → Authentication → Users:

1. Click **"Add user"**
2. Email: `test@example.com`
3. Password: `test123`
4. Add user

---

## 🧪 Step 8: Test the App

1. Open http://localhost:3001
2. Register with email/password OR
3. Login with test user
4. Test all features:
   - Dashboard
   - My Zones
   - Request Zone
   - View Requests
   - Profile

---

## 🏗️ Step 9: Build for Production

```bash
npm run build
```

Output in `/dist` folder

---

## 🚀 Step 10: Deploy to Firebase Hosting

### Initialize Firebase (first time only)

```bash
firebase login
firebase init hosting
```

Select:
- Existing project: `land-scanner-user-app`
- Public directory: `dist`
- Single-page app: `Yes`
- GitHub auto-deploy: `No`

### Deploy

```bash
npm run deploy
```

Or manually:

```bash
npm run build
firebase deploy --only hosting
```

Your app will be live at:
```
https://land-scanner-user-app.web.app
```

---

## ✅ Verification Checklist

- [ ] Firebase project created
- [ ] Email/Password auth enabled
- [ ] `.env` file configured
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server runs (`npm run dev`)
- [ ] Can register new user
- [ ] Can login successfully
- [ ] Dashboard loads
- [ ] Can request zone
- [ ] Backend API accessible

---

## 🔍 Troubleshooting

### Error: Firebase config not found
- Check `.env` file exists
- Verify all `VITE_FIREBASE_*` variables are set
- Restart dev server after changing `.env`

### Error: Network error / Backend not responding
- Check `VITE_BACKEND_URL` in `.env`
- Verify backend is running
- Check CORS settings in backend

### Error: Authentication failed
- Verify Email/Password is enabled in Firebase Console
- Check Firebase config is correct
- Try creating user directly in Firebase Console

### Images not loading
- Check backend API connection
- Verify user has zones assigned
- Check browser console for errors

---

## 📱 Features Overview

### Implemented Pages:
- ✅ **Login** - Email/password authentication
- ✅ **Register** - New user registration
- ✅ **Dashboard** - Stats and quick actions
- ✅ **My Zones** - View all assigned zones
- ✅ **Zone Detail** - View zone info and satellite images
- ✅ **Request Zone** - Submit new zone request
- ✅ **My Requests** - Track request status
- ✅ **Profile** - User info and subscription tier

### Key Features:
- 🔐 Firebase Authentication (separate project)
- 📡 Backend API integration
- 🖼️ Satellite image gallery with zoom
- 📍 Zone management
- 📝 Zone request workflow
- ⭐ Tier-based access display
- 📱 Fully responsive design

---

## 🆘 Need Help?

Check these files:
- `SETUP_GUIDE.md` - Detailed setup instructions
- `README.md` - Project overview
- `PROJECT_ANALYSIS.md` - Architecture details

---

## 🎉 You're All Set!

Your user web app is now ready. Users can:
1. Register/Login
2. View their assigned zones
3. Browse satellite images
4. Request new zones
5. Track request status

**Happy monitoring!** 🛰️
