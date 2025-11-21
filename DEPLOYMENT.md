# Deployment Guide

This application can be deployed using GitHub Actions to various hosting platforms that support WebSockets.

## ⚠️ Important: WebSocket Support Required

**This app uses Socket.io for real-time auction functionality.** You must use a hosting platform that supports WebSockets.

**❌ Netlify Free Tier** - Does NOT support WebSockets  
**✅ Railway** - Supports WebSockets (Recommended - Free tier with $5 credit/month)  
**✅ Render** - Supports WebSockets (Free tier available)  
**✅ Fly.io** - Supports WebSockets (Free tier available)

## Prerequisites

1. A GitHub repository
2. A hosting service account (Railway, Render, etc.)
3. MongoDB Atlas account (free tier available)
4. Environment variables configured

## Quick Start: Railway (Recommended)

Railway is the easiest option with excellent WebSocket support and a generous free tier.

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository

### Step 2: Configure Environment Variables

In Railway dashboard, go to your service → Variables tab and add:

**⚠️ CRITICAL: You MUST set `PROD_MONGO_URL` for the app to work!**

```
NODE_ENV=production
PORT=8080
PROD_MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/ipl-auction?retryWrites=true&w=majority
SECRET=your_jwt_secret_key_use_a_strong_random_string
FRONTEND_URL=https://your-app-name.up.railway.app
VITE_API_URL=https://your-app-name.up.railway.app
```

**Important Notes:**

- Replace `username`, `password`, and `cluster` in `PROD_MONGO_URL` with your actual MongoDB Atlas credentials
- Railway will automatically assign a PORT, but you can set it to 8080 if needed
- After setting `FRONTEND_URL` and `VITE_API_URL`, use your actual Railway app URL (found in Railway dashboard)
- You can optionally set `DEV_MONGO_URL` for local development, but `PROD_MONGO_URL` is required for production

### Step 3: Set Build and Start Commands

Railway auto-detects Node.js, but ensure these are set:

- **Build Command:** `npm install && npm run client-install && npm run build --prefix client`
- **Start Command:** `npm start`

### Step 4: Deploy

Railway will automatically deploy when you push to your main branch. Get your app URL from the Railway dashboard.

## Quick Start: Render

### Step 1: Create Render Account

1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository

### Step 2: Configure Service

- **Name:** Your app name
- **Environment:** Node
- **Build Command:** `npm install && npm run client-install && npm run build --prefix client`
- **Start Command:** `npm start`
- **Plan:** Free

### Step 3: Set Environment Variables

In Render dashboard → Environment tab:

```
NODE_ENV=production
PORT=8080
DEV_MONGO_URL=your_mongodb_atlas_connection_string
PROD_MONGO_URL=your_mongodb_atlas_connection_string
SECRET=your_jwt_secret_key_use_a_strong_random_string
FRONTEND_URL=https://your-app-name.onrender.com
VITE_API_URL=https://your-app-name.onrender.com
```

**Note:** Render assigns a PORT automatically, but the app will use it from the environment.

### Step 4: Deploy

Render will deploy automatically. Your app will be available at `https://your-app-name.onrender.com`

## GitHub Actions Setup

### 1. Add Secrets to GitHub Repository

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

#### For Railway Deployment:

1. Get your Railway token:

   - Go to Railway dashboard → Account Settings → Tokens
   - Create a new token
   - Copy the token

2. Add to GitHub Secrets:
   - `RAILWAY_TOKEN`: Your Railway token

#### For Render Deployment:

1. Get your Render deploy webhook:

   - Go to Render dashboard → Your Service → Settings → Webhooks
   - Copy the Deploy Hook URL

2. Add to GitHub Secrets:
   - `RENDER_DEPLOY_HOOK`: Your Render deploy webhook URL

### 2. Environment Variables Reference

See `env.example` file for all required environment variables:

```
NODE_ENV=production
PORT=8080
DEV_MONGO_URL=your_mongodb_atlas_connection_string
PROD_MONGO_URL=your_mongodb_atlas_connection_string
SECRET=your_jwt_secret_key
FRONTEND_URL=https://your-deployed-app-url.com
VITE_API_URL=https://your-deployed-app-url.com
```

## MongoDB Atlas Setup (Required)

Since this app requires MongoDB, you'll need to set up MongoDB Atlas (free tier available):

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (choose the free M0 tier)
4. Create a database user
5. Whitelist your IP address (or use `0.0.0.0/0` for all IPs - less secure but easier)
6. Get your connection string:
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Use this as your `PROD_MONGO_URL` environment variable

Example connection string:

```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/ipl-auction?retryWrites=true&w=majority
```

## Setting Up Environment Variables

### For Railway:

1. Go to your Railway project dashboard
2. Click on your service
3. Go to the "Variables" tab
4. Add all required variables (see `env.example`)

### For Render:

1. Go to your Render dashboard
2. Click on your web service
3. Go to the "Environment" tab
4. Add all required variables (see `env.example`)

**Important:** After setting `FRONTEND_URL` and `VITE_API_URL`, you'll need to rebuild your app so the client can use the correct API URL.

## Manual Deployment

If you prefer to deploy manually:

```bash
# Install dependencies
npm install
npm run client-install

# Build client
npm run build --prefix client

# Start server
npm start
```

## Important Notes

1. **Socket.io & WebSocket Support**:

   - ✅ Railway, Render, and Fly.io all support WebSockets
   - ❌ Netlify free tier does NOT support WebSockets
   - The app is already configured to use Socket.io with CORS support

2. **Environment Variables**:

   - The app uses `FRONTEND_URL` for CORS and Socket.io configuration
   - The client uses `VITE_API_URL` environment variable (set this in your hosting platform)
   - For Vite, environment variables must be prefixed with `VITE_` to be accessible in the client
   - After setting `VITE_API_URL`, rebuild your app

3. **MongoDB**:

   - Use MongoDB Atlas (free tier available) for production database
   - The app uses `PROD_MONGO_URL` in production mode
   - Make sure to whitelist your hosting platform's IP addresses in MongoDB Atlas

4. **Build Configuration**:

   - The Vite config already sets `outDir: "build"` which matches what the server expects
   - The build command installs dependencies and builds the client automatically

5. **Port Configuration**:

   - Railway and Render assign ports automatically via `PORT` environment variable
   - The app listens on `process.env.PORT || 8080`
   - Make sure `PORT` is set in your hosting platform (usually auto-set)

6. **Client-Server Communication**:
   - In production, both frontend and backend are served from the same domain
   - The client uses `VITE_API_URL` or falls back to `window.location.origin`
   - Socket.io connects to the same origin in production

## Troubleshooting

### MongoDB Connection Error: "uri parameter must be a string, got undefined"

**Error Message:**

```
MongooseError: The `uri` parameter to `openUri()` must be a string, got "undefined"
```

**Solution:**

1. Go to your Railway/Render dashboard
2. Navigate to your service → Variables/Environment tab
3. **Make sure `PROD_MONGO_URL` is set** (this is REQUIRED for production)
4. The value should look like:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
   ```
5. After adding/updating the variable, Railway/Render will automatically redeploy
6. Check the logs again - you should see "✅ Connected to the MongoDB database"

**Common Issues:**

- ❌ Variable name is wrong (should be `PROD_MONGO_URL`, not `MONGODB_URI` or `MONGO_URL`)
- ❌ Variable is set but empty (check for extra spaces or quotes)
- ❌ Variable is set in the wrong service/environment

### MongoDB Connection Error: Authentication Failed

**Error Message:**

```
MongoServerError: Authentication failed
```

**Solution:**

1. Verify your MongoDB Atlas username and password are correct
2. Make sure you've replaced `<password>` in the connection string with your actual password
3. Check that your database user has the correct permissions in MongoDB Atlas

### MongoDB Connection Error: IP Not Whitelisted

**Error Message:**

```
MongoServerError: IP not whitelisted
```

**Solution:**

1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. For Railway/Render, you can either:
   - Add `0.0.0.0/0` to allow all IPs (less secure but easier)
   - Or add Railway's/Render's specific IP ranges (check their documentation)

### Other Common Issues

- **Build fails**: Check Node.js version (should be 20.x)
- **Port already in use**: Railway/Render handles ports automatically, don't hardcode them
- **Socket.io not working**: Make sure `FRONTEND_URL` matches your deployed URL exactly
- **Client can't connect to API**: Set `VITE_API_URL` to your backend URL and rebuild
