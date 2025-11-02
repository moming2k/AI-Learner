# Deployment Guide - Invite-Only AI Learner Platform

## Overview
This guide covers deploying the AI Learner platform with invitation-only access.

## Recommended Deployment: Railway

### Cost Breakdown
- **Hosting**: $5/month (Hobby plan)
- **OpenAI API**: $0.50-$5/month (usage-based)
- **Total**: **~$5.50-$10/month**

### Prerequisites
1. GitHub account
2. Railway account (https://railway.app)
3. OpenAI API key
4. Invitation codes generated

---

## Quick Deployment Steps

### 1. Prepare Your Repository
```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Deploy to Railway

1. Visit https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select `moming2k/AI-Learner` repository
4. Select branch: `claude/invite-only-setup-guide-011CUjYcqicnq5grJ7h6bJvD` (or `main` after merging)

### 3. Add Persistent Volume for SQLite

In Railway dashboard:
1. Go to your service → **Variables** tab
2. Add a **Volume**:
   - **Mount Path**: `/app/data`
   - **Size**: 1GB (expandable)

### 4. Configure Environment Variables

Add these in Railway dashboard → **Variables**:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o
OPENAI_API_BASE_URL=https://api.openai.com/v1

# Authentication
AUTH_SECRET=generate-a-random-32-char-string
NODE_ENV=production

# Invitation Codes (comma-separated)
INVITATION_CODES=LEARN2024,EARLYACCESS,BETA001
```

**Generate AUTH_SECRET**:
```bash
openssl rand -base64 32
```

### 5. Deploy & Access

1. Railway will auto-deploy on git push
2. Get your URL: `your-app.railway.app`
3. Visit the URL → Login with invitation code
4. Start learning!

---

## Alternative Deployments

### Fly.io Deployment

1. Install flyctl: https://fly.io/docs/hands-on/install-flyctl/
2. Login: `flyctl auth login`
3. Launch:
```bash
flyctl launch --no-deploy
flyctl volumes create data --size 1 --region sjc
flyctl secrets set OPENAI_API_KEY=sk-xxx AUTH_SECRET=xxx INVITATION_CODES=xxx
flyctl deploy
```

**Cost**: $0.65-$8/month (free tier available)

### Vercel (Requires DB Migration)

⚠️ **Note**: Vercel requires migrating from SQLite to Postgres

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel --prod`
3. Add Vercel Postgres addon
4. Update database code to use Postgres

**Cost**: $20-$50/month

---

## Invitation Code Management

### Adding New Codes
Update environment variable in Railway:
```
INVITATION_CODES=CODE1,CODE2,CODE3,NEWCODE
```

### Revoking Codes
Remove from the comma-separated list and redeploy.

### One-Time Use Codes
Modify `lib/auth-db.ts` to mark codes as used after first authentication.

---

## Security Recommendations

1. **Strong Invitation Codes**: Use random 12+ character codes
2. **Rate Limiting**: Add rate limiting to login endpoint
3. **HTTPS Only**: Ensure Railway provides HTTPS (automatic)
4. **Secret Rotation**: Rotate AUTH_SECRET periodically
5. **OpenAI Key Security**: Never commit to git, use environment variables only

---

## Monitoring & Costs

### Railway Dashboard
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Billing**: Track monthly costs

### OpenAI Usage
Monitor at: https://platform.openai.com/usage

**Typical Costs per 1000 wiki pages**:
- GPT-4o: ~$5-$10
- GPT-3.5-turbo: ~$0.50-$1

---

## Troubleshooting

### Database Not Persisting
Ensure volume is mounted at `/app/data` in Railway settings.

### Authentication Loop
1. Check AUTH_SECRET is set
2. Clear browser cookies
3. Verify INVITATION_CODES format (comma-separated, no spaces)

### OpenAI Errors
1. Verify API key is valid
2. Check usage limits: https://platform.openai.com/account/limits
3. Review logs in Railway dashboard

---

## Scaling Considerations

**Current setup supports**:
- 100-500 concurrent users
- 1GB database (thousands of pages)
- Vertical scaling on Railway (upgrade plan)

**For larger scale**:
- Upgrade Railway plan ($10-$20/month)
- Add Redis for session caching
- Implement request queuing for OpenAI calls
- Consider Postgres migration for better query performance

---

## Backup Strategy

### Automated Backups (Railway)
Railway volumes include automatic snapshots.

### Manual Backups
```bash
# Download database via Railway CLI
railway run sqlite3 data/wiki.db .dump > backup.sql
```

### Restore
```bash
# Upload via Railway shell
railway run sqlite3 data/wiki.db < backup.sql
```

---

## Next Steps After Deployment

1. ✅ Test invitation code login
2. ✅ Generate a few wiki pages to verify OpenAI integration
3. ✅ Monitor costs in Railway + OpenAI dashboards
4. ✅ Share invitation codes with beta users
5. ✅ Set up monitoring alerts (optional)

---

## Support

- **Railway Docs**: https://docs.railway.app
- **OpenAI Status**: https://status.openai.com
- **Project Issues**: https://github.com/moming2k/AI-Learner/issues
