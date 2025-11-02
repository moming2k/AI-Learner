# Quick Start: Deploy AI Learner with Invite-Only Access

## 🚀 5-Minute Railway Deployment

### Step 1: Fork & Clone (Optional)
```bash
git clone https://github.com/moming2k/AI-Learner.git
cd AI-Learner
```

### Step 2: Sign up for Railway
1. Visit https://railway.app
2. Sign up with GitHub
3. Get $5 free credit (no credit card required)

### Step 3: Deploy
1. Go to https://railway.app/new
2. Click **"Deploy from GitHub repo"**
3. Select `AI-Learner` repository
4. Railway auto-detects Next.js and starts building

### Step 4: Add Volume for Database
1. In Railway dashboard, click your service
2. Go to **"Settings"** → **"Volumes"**
3. Click **"Add Volume"**
   - **Mount Path**: `/app/data`
   - **Size**: 1GB

### Step 5: Configure Environment Variables
Click **"Variables"** tab and add:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o
INVITATION_CODES=LEARN2024,WELCOME,BETA
NODE_ENV=production
```

**Get OpenAI API Key**: https://platform.openai.com/api-keys

### Step 6: Deploy & Access
1. Click **"Deploy"** (Railway redeploys automatically)
2. Get your URL from the **"Settings"** → **"Domains"** section
3. Visit `https://your-app.railway.app`
4. Login with: `LEARN2024` (or any code you set)

---

## 🎯 What You Get

✅ **Invite-only access** - Only people with codes can use it
✅ **Persistent database** - All wiki pages saved to SQLite
✅ **HTTPS enabled** - Secure by default
✅ **Auto-scaling** - Handles traffic spikes
✅ **30-day sessions** - Users stay logged in

---

## 💰 Cost Calculator

| Users/Month | Wiki Pages Generated | OpenAI Cost | Railway Cost | **Total** |
|-------------|---------------------|-------------|--------------|-----------|
| 1-5         | ~100 pages          | $0.50-$1    | $5           | **$5.50-$6** |
| 5-20        | ~500 pages          | $2-$5       | $5           | **$7-$10** |
| 20-50       | ~2000 pages         | $10-$20     | $10          | **$20-$30** |

**OpenAI Pricing**:
- GPT-4o: ~$0.01 per page
- GPT-4o-mini: ~$0.001 per page (10x cheaper!)

**Tip**: Start with `gpt-4o-mini` to save costs, upgrade to `gpt-4o` later.

---

## 🔐 Managing Invitation Codes

### Add New Codes
1. Go to Railway dashboard → **Variables**
2. Update `INVITATION_CODES`: `CODE1,CODE2,CODE3,NEWCODE`
3. Save (automatic redeploy)

### Remove/Revoke Codes
Just remove from the comma-separated list and save.

### One-Time Use Codes
Current implementation allows unlimited reuse. To implement one-time codes:
1. Add a `used_codes` table to database
2. Check on login if code already used
3. Mark as used after first successful login

---

## 🔧 Troubleshooting

### "Invalid invitation code" error
- Check `INVITATION_CODES` in Railway Variables
- Ensure no spaces: `CODE1,CODE2,CODE3` ✅ not `CODE1, CODE2, CODE3` ❌
- Codes are case-insensitive: `learn2024` = `LEARN2024`

### Database not persisting
- Verify volume is mounted at `/app/data`
- Check Railway Logs for database errors

### OpenAI API errors
- Verify API key is valid: https://platform.openai.com/api-keys
- Check usage limits: https://platform.openai.com/account/limits
- Try `gpt-4o-mini` if `gpt-5` unavailable

### Login page keeps redirecting
- Clear browser cookies
- Check Railway logs for middleware errors
- Ensure `NODE_ENV=production` is set

---

## 🌍 Alternative Deployments

### Fly.io (Free Tier Available)
```bash
flyctl launch --no-deploy
flyctl volumes create data --size 1 --region sjc
flyctl secrets set OPENAI_API_KEY=sk-xxx INVITATION_CODES=xxx
flyctl deploy
```

**Cost**: $0-$3/month (free tier covers most usage)

### Vercel (Requires DB Migration)
⚠️ **Warning**: Vercel is serverless, cannot use SQLite. Must migrate to Postgres.

```bash
npm i -g vercel
vercel --prod
# Add Vercel Postgres from dashboard
# Update lib/db.ts to use Postgres
```

**Cost**: $20-$50/month (Pro plan required for auth)

---

## 📊 Monitoring

### Railway Dashboard
- **Metrics**: CPU, RAM, Network usage
- **Logs**: Real-time application logs
- **Billing**: Track monthly costs

### OpenAI Dashboard
Monitor API usage: https://platform.openai.com/usage

---

## 🚨 Security Checklist

- [ ] Generated strong invitation codes (12+ chars)
- [ ] Set up OpenAI billing limits: https://platform.openai.com/account/billing/limits
- [ ] Enabled HTTPS (automatic on Railway)
- [ ] Never committed `.env.local` to git
- [ ] Reviewed Railway logs for suspicious activity

---

## 📚 Next Steps

1. ✅ Test login with invitation code
2. ✅ Generate your first wiki page
3. ✅ Share codes with beta testers
4. ✅ Monitor costs in dashboards
5. ✅ Set up billing alerts in OpenAI

---

## 🆘 Need Help?

- **Railway Docs**: https://docs.railway.app
- **OpenAI Status**: https://status.openai.com
- **Project Issues**: https://github.com/moming2k/AI-Learner/issues

---

**🎉 Congratulations! Your AI learning platform is live!**
