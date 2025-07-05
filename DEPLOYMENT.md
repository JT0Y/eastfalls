# Netlify Deployment Guide for EastFalls.Homes

## Prerequisites
- Netlify account
- GitHub repository connected to Netlify
- Domain: eastfalls.homes

## Deployment Steps

### 1. Build Configuration
The project is already configured with:
- `netlify.toml` - Build settings and redirects
- `public/_redirects` - SPA routing fallback
- `package.json` - Build script: `npm run build`

### 2. Environment Variables (Optional)
Currently, the Gemini API key is hardcoded in the ItineraryWidget. For better security, you can set it as an environment variable:

In Netlify Dashboard:
1. Go to Site Settings > Environment Variables
2. Add: `VITE_GEMINI_API_KEY` = `AIzaSyDVUQAPgwrUtHuxw9YuqQjA4euOtEI2F6M`

### 3. API Compatibility
All APIs are configured to work in production:

#### ✅ Working APIs:
- **Weather**: Uses CORS proxy (api.allorigins.win)
- **SEPTA**: Uses CORS proxy for detours and alerts
- **Reddit**: Uses JSON API (no CORS issues)
- **Gemini AI**: Direct API call with key
- **ArcGIS**: Direct API calls (public data)
- **Carto**: Direct API calls (public data)

#### 🔧 Fallback Strategy:
All APIs have mock data fallbacks if the real APIs fail.

### 4. Deploy to Netlify

#### Option A: Deploy from Git
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy

#### Option B: Deploy from CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### 5. Custom Domain Setup
1. In Netlify Dashboard, go to Domain Settings
2. Add custom domain: `eastfalls.homes`
3. Configure DNS if needed

### 6. Post-Deployment Verification

Check these features work in production:
- [ ] Weather widget loads data
- [ ] Reddit widget fetches posts
- [ ] Itinerary widget generates AI responses
- [ ] SEPTA widget shows transit data
- [ ] All widgets are draggable/reorderable
- [ ] Dark mode toggle works
- [ ] Responsive design on mobile

### 7. Troubleshooting

#### CORS Issues
If any APIs fail due to CORS:
- The app already uses CORS proxies for most APIs
- Mock data fallbacks are in place
- Check browser console for specific errors

#### API Key Issues
If Gemini API fails:
- Verify the API key is correct
- Check if the key has usage limits
- Ensure the key is enabled for the Gemini API

#### Build Issues
If build fails:
- Check Node.js version (should be 18+)
- Verify all dependencies are installed
- Check for TypeScript errors

### 8. Performance Optimization
- The app uses Vite for fast builds
- Tailwind CSS is purged in production
- Images are optimized
- Code splitting is enabled

### 9. Monitoring
- Set up Netlify Analytics
- Monitor API response times
- Check for 404 errors on SPA routes

## Production URLs
- Main site: https://eastfalls.homes
- Netlify preview: https://[site-name].netlify.app 