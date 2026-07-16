# 🔥 Firebase Configuration - Ready!

## 🏗️ Architecture Note

This user web app uses **Project 2 (P2): land-scanner-webapp**

**Important:** This is a **separate Firebase project** from the admin panel:
- **Admin Panel (P1):** l

---

## ✅ Your Firebase Project Details

- **Project Name:** land-scanner-webapp
- **Project ID:** land-scanner-webapp
- **Auth Domain:** land-scanner-webapp.firebaseapp.com

---

## 📝 Step 1: Create .env File

In the `website-userend` folder, create a `.env` file with this content:

```env
# User Firebase Project (Separate for Authentication)
VITE_FIREBASE_API_KEY=AIzaSyAPjTmFiaHLXtqO21I6NcorUMB3a6sjFKQ
VITE_FIREBASE_AUTH_DOMAIN=land-scanner-webapp.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=land-scanner-webapp
VITE_FIREBASE_STORAGE_BUCKET=land-scanner-webapp.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=516405024853
VITE_FIREBASE_APP_ID=1:516405024853:web:05aff4e6bd147722891cdc

# Backend API (Update with your backend URL)
VITE_BACKEND_URL=http://localhost:8000
```

**For production, change VITE_BACKEND_URL to:**
```
VITE_BACKEND_URL=https://land-scanner-backend.onrender.com
```
(or wherever your backend is deployed)

---

## 🔐 Step 2: Enable Email/Password Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/project/land-scanner-webapp)
2. Click **Authentication** in the left menu
3. Click **Get Started**
4. Click **Sign-in method** tab
5. Click **Email/Password**
6. Enable it (toggle the switch)
7. Click **Save**

---

## 👥 Step 3: Create Test User (Optional)

In Firebase Console → Authentication → Users:
1. Click **Add user**
2. Email: `test@example.com`
3. Password: `test123456`
4. Click **Add user**

---

## 🚀 Step 4: Run the App

```bash
cd website-userend

# Install dependencies
npm install

# Run development server
npm run dev
```

Opens at: **http://localhost:3001**

---

## 🧪 Step 5: Test

1. Open http://localhost:3001
2. Click **Create account**
3. Register with your email
4. Or login with test user: `test@example.com` / `test123456`

---

## 📦 Step 6: Update .firebaserc

Update `website-userend/.firebaserc`:

```json
{
  "projects": {
    "default": "land-scanner-webapp"
  }
}
```

This is already configured for you!

---

## 🚀 Step 7: Deploy

```bash
# Login to Firebase
firebase login

# Build
npm run build

# Deploy
firebase deploy --only hosting
```

Your app will be live at:
```
https://land-scanner-webapp.web.app
```

---

## ✅ Checklist

- [x] Firebase project created: `land-scanner-webapp`
- [ ] Create `.env` file with above config
- [ ] Enable Email/Password authentication in Firebase Console
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Test registration/login
- [ ] Deploy to Firebase Hosting

---

## 🔍 Troubleshooting

### Can't login/register?
- Check Email/Password is enabled in Firebase Console
- Verify `.env` file exists and has correct values
- Restart dev server after creating `.env`

### Backend not responding?
- Update `VITE_BACKEND_URL` in `.env`
- Make sure backend is running
- Check backend CORS settings

---

## 🎉 You're Ready!

Your Firebase configuration is complete. Just:
1. Create the `.env` file
2. Enable authentication
3. Run the app!

**Happy coding!** 🚀
