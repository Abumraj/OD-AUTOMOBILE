# Quick Setup Guide

## Installation Steps

### 1. Install Dependencies

```powershell
# Navigate to the project directory
cd c:\od-auto\laravel-backend

# Install Composer dependencies
composer install

# Install NPM dependencies
npm install
```

### 2. Environment Configuration

```powershell
# Create environment file
copy .env.example .env

# Generate application key
php artisan key:generate
```

### 3. Run the Application

**Option A: Run both servers separately (Recommended for development)**

Terminal 1 - Laravel Backend:
```powershell
php artisan serve
```

Terminal 2 - Vite Frontend:
```powershell
npm run dev
```

Then open: `http://localhost:8000`

**Option B: Build for production**

```powershell
npm run build
php artisan serve
```

## Verification

Once running, you should see:
- ✅ Navigation bar with OD Automotive logo
- ✅ Hero section with truck image
- ✅ $1000 deposit section
- ✅ Four service cards
- ✅ Tracking section with progress bar
- ✅ 100+ cars delivered section
- ✅ Three testimonials
- ✅ Footer with links
- ✅ Floating WhatsApp button

## Troubleshooting

### Port Already in Use
If port 8000 is busy:
```powershell
php artisan serve --port=8080
```

### Vite Not Connecting
Ensure both servers are running and check the console for errors.

### Database Errors
If you see database errors, either:
1. Configure MySQL in `.env`
2. Or use SQLite by setting `DB_CONNECTION=sqlite` in `.env`

## Project Comparison

| Feature | Original HTML | React + Laravel |
|---------|---------------|-----------------|
| **Frontend** | Static HTML | React Components |
| **Styling** | Tailwind CDN | Tailwind + PostCSS |
| **Backend** | None | Laravel API |
| **Build Tool** | None | Vite |
| **State Management** | None | React Hooks |
| **Routing** | Hash/None | Laravel + React Router Ready |
| **API Ready** | No | Yes (Quote, Tracking) |
| **Component Reusability** | No | Yes |
| **Production Build** | Copy files | `npm run build` |

## Next Steps

1. **Test the API endpoints:**
   - POST `http://localhost:8000/api/quotes`
   - POST `http://localhost:8000/api/tracking`
   - GET `http://localhost:8000/api/health`

2. **Customize components:**
   - Edit files in `resources/js/components/`
   - Changes hot-reload automatically

3. **Add database models:**
   - Create migrations for storing quotes/tracking data
   - Connect API controllers to database

4. **Deploy:**
   - Build assets: `npm run build`
   - Deploy Laravel app to your hosting provider
