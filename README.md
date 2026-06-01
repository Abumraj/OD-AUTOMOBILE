# OD Automotive & Logistics - React + Laravel

This is a complete rewrite of the OD Automotive website using React for the frontend and Laravel for the backend API, maintaining the exact appearance and functionality of the original HTML version.

## Tech Stack

### Backend
- **Laravel 10.x** - PHP framework for API and server-side routing
- **PHP 8.1+** - Server-side programming language

### Frontend
- **React 18** - Component-based UI library
- **Vite** - Fast build tool and dev server
- **Tailwind CSS 3** - Utility-first CSS framework
- **React Router** - Client-side routing

## Project Structure

```
laravel-backend/
├── app/
│   └── Http/
│       └── Controllers/
│           └── Api/
│               ├── QuoteController.php
│               └── TrackingController.php
├── resources/
│   ├── css/
│   │   └── app.css
│   ├── js/
│   │   ├── app.jsx
│   │   └── components/
│   │       ├── App.jsx
│   │       ├── TopNavBar.jsx
│   │       ├── Hero.jsx
│   │       ├── DepositSection.jsx
│   │       ├── ServicesSection.jsx
│   │       ├── TrackingSection.jsx
│   │       ├── PerformanceCounter.jsx
│   │       ├── Testimonials.jsx
│   │       ├── Footer.jsx
│   │       └── WhatsAppButton.jsx
│   └── views/
│       └── app.blade.php
├── routes/
│   ├── web.php
│   └── api.php
└── public/
    └── index.php
```

## Installation

### Prerequisites
- PHP 8.1 or higher
- Composer
- Node.js 18+ and npm
- MySQL (optional, for database features)

### Setup Instructions

1. **Clone or navigate to the project directory:**
   ```bash
   cd c:\od-auto\laravel-backend
   ```

2. **Install PHP dependencies:**
   ```bash
   composer install
   ```

3. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

4. **Set up environment file:**
   ```bash
   copy .env.example .env
   ```

5. **Generate application key:**
   ```bash
   php artisan key:generate
   ```

6. **Configure database (optional):**
   - Edit `.env` file with your database credentials
   - Run migrations if needed:
     ```bash
     php artisan migrate
     ```

## Development

### Running the Application

1. **Start the Laravel development server:**
   ```bash
   php artisan serve
   ```
   This will start the server at `http://localhost:8000`

2. **In a new terminal, start the Vite dev server:**
   ```bash
   npm run dev
   ```
   This will compile and hot-reload your React components

3. **Access the application:**
   Open your browser and navigate to `http://localhost:8000`

## Building for Production

1. **Build the frontend assets:**
   ```bash
   npm run build
   ```

2. **Optimize Laravel:**
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

3. **Deploy to your web server**

## API Endpoints

### Quote Request
- **POST** `/api/quotes`
- Request body:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "service": "procurement",
    "message": "Optional message"
  }
  ```

### Tracking
- **POST** `/api/tracking`
- Request body:
  ```json
  {
    "reference_number": "REF123456"
  }
  ```

### Health Check
- **GET** `/api/health`

## Features

### Exact Replicas of Original Design
- ✅ Top navigation bar with logo and menu
- ✅ Hero section with background image and CTA buttons
- ✅ Deposit trust-building section
- ✅ Services section with 4 service cards
- ✅ Real-time tracking section with progress bar
- ✅ Performance counter section
- ✅ Client testimonials section
- ✅ Footer with company info and links
- ✅ Floating WhatsApp button

### React Components
All sections are componentized for reusability and maintainability:
- `TopNavBar` - Navigation header
- `Hero` - Main hero section
- `DepositSection` - $1000 deposit explanation
- `ServicesSection` - Four service cards
- `TrackingSection` - Tracking form with progress bar
- `PerformanceCounter` - Stats display
- `Testimonials` - Customer reviews
- `Footer` - Site footer
- `WhatsAppButton` - Floating action button

### Styling
- Complete Tailwind CSS configuration matching the original design
- Custom color palette from the original theme
- Material Icons for consistent iconography
- Responsive design for mobile and desktop
- Dark mode enabled by default

## Customization

### Updating Colors
Edit `tailwind.config.js` to modify the color scheme.

### Adding New Components
Create new React components in `resources/js/components/` and import them in `App.jsx`.

### API Integration
Controllers are located in `app/Http/Controllers/Api/` for easy modification and extension.

## License

MIT License

## Support

For issues or questions, contact OD Automotive & Logistics.
