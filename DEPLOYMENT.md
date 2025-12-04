# Deployment Guide - Cloudflare Pages

This project is configured to automatically deploy to Cloudflare Pages via GitHub Actions whenever code is pushed to the `main` branch.

## Prerequisites

- A Cloudflare account (free tier works fine)
- Admin access to the GitHub repository

## Initial Setup

### 1. Create a Cloudflare Pages Project

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** in the left sidebar
3. Click **Create application** → **Pages** → **Connect to Git**
4. **Important**: You can skip the Git connection for now since we're using GitHub Actions
5. Instead, click **Create using Direct Upload** and name your project `jw3b-dev-portfolio`
6. You can cancel after creating the project - we just need it to exist

### 2. Get Your Cloudflare Account ID

1. In the Cloudflare Dashboard, go to **Workers & Pages**
2. Click on your Pages project (`jw3b-dev-portfolio`)
3. Your Account ID is visible in the URL: `https://dash.cloudflare.com/<ACCOUNT_ID>/pages/...`
4. Alternatively, find it in **Account Home** on the right sidebar

### 3. Create a Cloudflare API Token

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Click **Use template** next to **Edit Cloudflare Workers**
4. Modify the token:
   - **Token name**: `GitHub Actions - jw3b.dev`
   - **Permissions**: 
     - Account → Cloudflare Pages → Edit
   - **Account Resources**: Include → Your account
5. Click **Continue to summary** → **Create Token**
6. **Important**: Copy the token immediately - you won't be able to see it again!

### 4. Add Secrets to GitHub

1. Go to your GitHub repository: `https://github.com/jw3b-dev/jw3b.dev_portfolio_website`
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:
   - **Name**: `CLOUDFLARE_API_TOKEN`
   - **Value**: Paste the API token from step 3
4. Click **Add secret**
5. Click **New repository secret** again and add:
   - **Name**: `CLOUDFLARE_ACCOUNT_ID`
   - **Value**: Paste your account ID from step 2
6. Click **Add secret**

## Deployment

Once the secrets are configured, deployment is automatic:

1. Push code to the `main` branch:
   ```bash
   git push origin main
   ```

2. GitHub Actions will automatically:
   - Install dependencies
   - Build the Vite application
   - Deploy to Cloudflare Pages

3. Monitor the deployment:
   - Go to the **Actions** tab in your GitHub repository
   - Click on the latest workflow run to see progress
   - Deployment typically takes 1-2 minutes

4. Access your site:
   - Your site will be available at: `https://jw3b-dev-portfolio.pages.dev`
   - You can also set up a custom domain in the Cloudflare Pages settings

## Custom Domain Setup (Optional)

1. In Cloudflare Dashboard, go to your Pages project
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain (e.g., `jw3b.dev`)
5. Follow the DNS configuration instructions

## Troubleshooting

### Workflow fails with "Invalid API token"
- Verify the `CLOUDFLARE_API_TOKEN` secret is set correctly
- Ensure the API token has the correct permissions (Cloudflare Pages → Edit)
- Check that the token hasn't expired

### Workflow fails with "Project not found"
- Verify the `CLOUDFLARE_ACCOUNT_ID` is correct
- Ensure the project name in `.github/workflows/deploy.yml` matches your Cloudflare Pages project name
- Make sure the Pages project exists in your Cloudflare account

### Build fails
- Check the workflow logs in the GitHub Actions tab
- Verify the build works locally: `npm run build`
- Ensure all dependencies are properly listed in `package.json`

### Site shows 404 or blank page
- Verify the `directory` in the workflow is set to `dist` (Vite's default output)
- Check that the build output contains an `index.html` file
- Review the Cloudflare Pages deployment logs

## Manual Deployment (Alternative)

If you prefer to deploy manually without GitHub Actions:

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build the project
npm run build

# Deploy
wrangler pages deploy dist --project-name=jw3b-dev-portfolio
```

## Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [GitHub Actions for Cloudflare Pages](https://github.com/cloudflare/pages-action)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
