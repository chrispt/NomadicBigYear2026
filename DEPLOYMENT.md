# Deployment Guide

Complete step-by-step guide for deploying Nomadic Big Year 2026 to Railway (backend) and Vercel (frontend).

## Prerequisites

- GitHub account
- Railway account (sign up with GitHub at [railway.app](https://railway.app))
- Vercel account (sign up with GitHub at [vercel.com](https://vercel.com))
- SendGrid account for email (or use dev mode)

---

## Part 1: Push Code to GitHub

### 1. Initialize Git Repository

```bash
cd NomadicBigYear2026
git init
git add .
git commit -m "Initial commit: Nomadic Big Year 2026 portal"
```

### 2. Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository named `nomadic-big-year-2026`
3. Make it **private** (recommended)
4. **Don't** initialize with README (you already have one)

### 3. Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/nomadic-big-year-2026.git
git branch -M main
git push -u origin main
```

---

## Part 2: Deploy Backend to Railway

### 1. Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub
5. Select your `nomadic-big-year-2026` repository

### 2. Add PostgreSQL Database

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway automatically creates the database
4. The `DATABASE_URL` environment variable is auto-configured ✅

### 3. Configure Backend Service

Railway should auto-detect your Python app. Verify these settings:

1. Click on your **backend service** (should show Python logo)
2. Go to **"Settings"** tab
3. Verify:
   - **Root Directory**: Should be empty (we'll use railway.toml)
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Note:** The `railway.toml` file in the root will handle this automatically.

### 4. Generate JWT Secret Key

On your local machine, run:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the output (something like: `xK7jP9mQ2nR8sT5vW3yZ4aB6cD1eF0gH9iJ8kL7mN6oP5q`)

### 5. Set Environment Variables

1. In Railway, click on your backend service
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** and add:

```
JWT_SECRET_KEY=<paste-your-generated-secret>
FRONTEND_URL=https://nomadic-big-year-2026.vercel.app
SENDGRID_API_KEY=<leave-empty-for-now>
FROM_EMAIL=noreply@nomadicbigyear.com
```

**Note:** We'll update `FRONTEND_URL` with your actual Vercel URL later.

### 6. Get SendGrid API Key (for production email)

**Option A: Use SendGrid (Production)**

1. Sign up at [sendgrid.com](https://sendgrid.com) (free tier: 100 emails/day)
2. Verify your sender identity (email address or domain)
3. Go to **Settings** → **API Keys**
4. Click **"Create API Key"**
5. Name: `nomadic-big-year-2026`
6. Choose **"Restricted Access"**
7. Enable only **"Mail Send"** → **"Full Access"**
8. Copy the API key (starts with `SG.`)
9. Add to Railway variables: `SENDGRID_API_KEY=SG.xxxxx`

**Option B: Dev Mode (Testing)**

Leave `SENDGRID_API_KEY` empty. Magic links will print to Railway logs instead of sending emails.

### 7. Deploy Backend

Railway auto-deploys when you push to GitHub. To manually trigger:

1. Go to **"Deployments"** tab
2. Click **"Deploy"**
3. Wait for build to complete (2-3 minutes)
4. Check **"Build Logs"** if errors occur

### 8. Get Your Backend URL

1. In Railway, click on your backend service
2. Go to **"Settings"** tab
3. Scroll to **"Networking"** → **"Public Networking"**
4. Click **"Generate Domain"**
5. Your URL will be: `https://nomadic-big-year-2026-production.up.railway.app`

**Save this URL - you'll need it for Vercel!**

### 9. Initialize Database Schema

**Option A: Using Railway CLI (Recommended)**

Install Railway CLI:
```bash
# Mac/Linux
curl -fsSL https://railway.app/install.sh | sh

# Windows (PowerShell)
iwr https://railway.app/install.ps1 | iex
```

Run migration:
```bash
railway login
railway link  # Select your project
railway run psql $DATABASE_URL < database/schema.sql
```

**Option B: Using PostgreSQL Client Locally**

1. In Railway, click on your **PostgreSQL** service
2. Go to **"Connect"** tab
3. Copy the **"Postgres Connection URL"**
4. On your local machine:

```bash
psql "postgresql://postgres:password@host:port/railway" < database/schema.sql
```

**Option C: Using Railway Dashboard**

1. Click on PostgreSQL service
2. Go to **"Data"** tab
3. Click **"Query"**
4. Copy/paste contents of `database/schema.sql`
5. Click **"Run"**

### 10. Test Backend

Visit your backend URL:
```
https://your-app.up.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

Visit API docs:
```
https://your-app.up.railway.app/docs
```

---

## Part 3: Deploy Frontend to Vercel

### 1. Import Project to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Vercel will detect it's a Vite project ✅

### 2. Configure Build Settings

Vercel should auto-detect these, but verify:

- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

The `vercel.json` file will handle most of this.

### 3. Set Environment Variables

1. Before deploying, click **"Environment Variables"**
2. Add this variable:

```
Name: VITE_API_URL
Value: https://your-railway-backend.up.railway.app
```

**Important:** Replace with your actual Railway backend URL from Part 2, Step 8.

3. Select **"Production"**, **"Preview"**, and **"Development"**
4. Click **"Add"**

### 4. Deploy Frontend

1. Click **"Deploy"**
2. Wait 1-2 minutes for build
3. Vercel will show your live URL: `https://nomadic-big-year-2026.vercel.app`

### 5. Update Backend CORS

Now that you have your Vercel URL, update Railway:

1. Go back to **Railway**
2. Click on your **backend service**
3. Go to **"Variables"** tab
4. Edit `FRONTEND_URL`:

```
FRONTEND_URL=https://nomadic-big-year-2026.vercel.app
```

5. Railway will auto-redeploy (wait 1-2 minutes)

### 6. Test Full Stack

1. Visit your Vercel URL: `https://nomadic-big-year-2026.vercel.app`
2. Click **"Log In"**
3. Enter your email
4. Check email for magic link (or Railway logs if using dev mode)
5. Click magic link to log in
6. Try uploading a CSV file

---

## Part 4: Custom Domain (Optional)

### Add Custom Domain to Vercel

1. In Vercel project, go to **"Settings"** → **"Domains"**
2. Add your domain: `nomadicbigyear.com`
3. Follow DNS configuration instructions
4. Update Railway's `FRONTEND_URL` to your custom domain

### Add Custom Domain to Railway

1. In Railway backend service, go to **"Settings"**
2. Under **"Networking"**, add custom domain: `api.nomadicbigyear.com`
3. Configure DNS (Railway provides instructions)
4. Update Vercel's `VITE_API_URL` to your custom API domain

---

## Troubleshooting

### Backend Issues

**Build fails on Railway:**
- Check `backend/requirements.txt` exists
- Verify Python version (Railway uses 3.11 by default)
- Check build logs for missing dependencies

**Database connection fails:**
- Ensure PostgreSQL service is running in Railway
- Verify `DATABASE_URL` is set (Railway does this automatically)
- Check if schema was applied: `railway run psql $DATABASE_URL -c "\dt"`

**Magic links not sending:**
- If using SendGrid: Verify API key is correct
- Check sender email is verified in SendGrid
- In dev mode: Check Railway logs for printed magic links

### Frontend Issues

**Build fails on Vercel:**
- Ensure `frontend/package.json` exists
- Check build logs for errors
- Verify Node version (Vercel uses 18.x by default)

**API calls fail (CORS errors):**
- Verify `VITE_API_URL` in Vercel matches Railway backend URL
- Ensure `FRONTEND_URL` in Railway matches Vercel frontend URL
- Check browser console for specific error messages

**Login doesn't work:**
- Verify `VITE_API_URL` is set correctly in Vercel
- Check that magic link token is valid
- Ensure SendGrid API key is set (or using dev mode)

### Database Issues

**Schema not applied:**
```bash
railway run psql $DATABASE_URL < database/schema.sql
```

**Need to reset database:**
```bash
railway run psql $DATABASE_URL
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
\i database/schema.sql
```

---

## Post-Deployment Checklist

- [ ] Backend health check returns "healthy"
- [ ] Frontend loads without errors
- [ ] Can request magic link (email sent or logged)
- [ ] Can verify magic link and log in
- [ ] Can upload CSV file
- [ ] Leaderboard displays after upload
- [ ] Profile page shows stats
- [ ] Can update profile settings
- [ ] CORS is configured correctly
- [ ] Environment variables are set in both platforms

---

## Automatic Deployments

Both Railway and Vercel auto-deploy on `git push`:

1. Make code changes locally
2. Commit: `git commit -am "Your changes"`
3. Push: `git push`
4. Railway and Vercel automatically detect changes and deploy
5. Check deployment logs in both dashboards

---

## Cost Estimate

### Railway (Backend + Database)
- **Free Tier**: $5/month credit (enough for small projects)
- **Hobby Plan**: $5/month (if you exceed free tier)
- **PostgreSQL**: Included in free/hobby tier

### Vercel (Frontend)
- **Hobby Plan**: Free forever
- **Bandwidth**: 100 GB/month
- **Builds**: Unlimited

### SendGrid (Email)
- **Free Tier**: 100 emails/day (3,000/month)
- **Essentials Plan**: $19.95/month (40,000 emails/month)

**Total for small group (<20 users): $0-5/month**

---

## Monitoring

### Railway Logs

View real-time logs:
```bash
railway logs
```

Or in Railway dashboard: Service → **"Logs"** tab

### Vercel Logs

View deployment logs:
1. Go to Vercel dashboard
2. Select your project
3. Click **"Deployments"**
4. Click on a deployment → **"Build Logs"** or **"Function Logs"**

### Health Checks

Set up monitoring (optional):
- [UptimeRobot](https://uptimerobot.com) - Free tier monitors every 5 minutes
- Monitor: `https://your-backend.up.railway.app/health`

---

## Backup Strategy

### Database Backups

Railway includes automatic backups. To manually backup:

```bash
railway run pg_dump $DATABASE_URL > backup.sql
```

To restore:
```bash
railway run psql $DATABASE_URL < backup.sql
```

---

## Getting Help

**Railway Support:**
- Discord: [discord.gg/railway](https://discord.gg/railway)
- Docs: [docs.railway.app](https://docs.railway.app)

**Vercel Support:**
- Discord: [vercel.com/discord](https://vercel.com/discord)
- Docs: [vercel.com/docs](https://vercel.com/docs)

**Project Issues:**
- GitHub Issues in your repository
- Facebook group for your RV community

---

## Success! 🎉

Your Nomadic Big Year 2026 portal is now live:

- **Frontend**: `https://nomadic-big-year-2026.vercel.app`
- **Backend API**: `https://nomadic-big-year-2026-production.up.railway.app`
- **API Docs**: `https://nomadic-big-year-2026-production.up.railway.app/docs`

Share the frontend URL with your RV community and start tracking birds! 🦅 🚐
