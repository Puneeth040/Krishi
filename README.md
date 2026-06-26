<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy this app (Vercel)

This repository contains everything you need to run the app locally and deploy it to Vercel.

View your app in AI Studio: https://ai.studio/apps/0b6cb2bb-5817-4e15-9179-da151fdf19d2

## Deploy to Vercel (recommended)

Follow these steps to deploy this project to Vercel:

1. Push your code to GitHub (this repository).
2. Go to https://vercel.com and log in (or sign up).
3. Click "New Project" → "Import Git Repository" and choose the `Puneeth040/Krishi` repository.
4. In the import settings (Environment Variables), add the following env var:
   - `GEMINI_API_KEY` — your Gemini API key (set for Production and Preview)

5. Confirm the Project Settings:
   - Install Command: `npm install` (Vercel usually detects this automatically)
   - Build Command: `npm run build` (if your project doesn't have a build step, Vercel will use the detected framework defaults)
   - Output Directory: leave blank for frameworks like Next.js, or set if your project requires a specific output folder

6. Click "Deploy". Vercel will build and deploy your app. After deployment, you'll get a production URL.

Notes:
- If you need Preview and Production environment variables, add `GEMINI_API_KEY` to both environments in the Vercel dashboard.
- If your project uses a different build command or framework, update the Build Command accordingly in the Vercel import settings.

### Deploy using the Vercel CLI (alternative)

1. Install the Vercel CLI: `npm i -g vercel`
2. Log in: `vercel login`
3. From the project root run: `vercel` and follow the prompts to link or create a project
4. Add environment variables via the CLI:
   - `vercel env add GEMINI_API_KEY production`
   - `vercel env add GEMINI_API_KEY preview`
   - `vercel env add GEMINI_API_KEY development`
5. Deploy: `vercel --prod`

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Create a `.env.local` file in the project root and set your Gemini API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
3. Run the app locally:
   `npm run dev`

Troubleshooting:
- If Vercel build fails, check the Build Logs in your Vercel dashboard for errors and ensure all required environment variables are set.
- If your project needs a custom build or start command, add those in the Vercel import settings.

If you want, I can also add a `vercel.json` or update package.json scripts to make deployment smoother — tell me which framework (Next.js, Create React App, etc.) this project uses and I'll add recommended config.