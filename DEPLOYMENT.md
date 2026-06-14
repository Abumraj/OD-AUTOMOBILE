# Deployment Endpoints Documentation

This document describes the deployment endpoints available for running migrations and maintenance tasks after deployment.

## Security

All deployment endpoints are protected by a deployment token that must be set in your environment variables.

### Setup

1. Generate a secure random token:
```bash
php -r "echo bin2hex(random_bytes(32));"
```

2. Add to your `.env` file:
```env
DEPLOYMENT_TOKEN=your_generated_token_here
```

3. Never commit the token to version control. Keep it secure.

## Available Endpoints

### 1. Run Migrations

**Endpoint:** `POST /api/deploy/migrate`

**Description:** Executes all pending database migrations with the `--force` flag (required for production).

**Authentication:** 
- Header: `X-Deployment-Token: your_token_here`
- OR Query parameter: `?token=your_token_here`

**Example Request:**
```bash
# Using header (recommended)
curl -X POST https://your-domain.com/api/deploy/migrate \
  -H "X-Deployment-Token: your_token_here"

# Using query parameter
curl -X POST "https://your-domain.com/api/deploy/migrate?token=your_token_here"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Migrations executed successfully",
  "output": "Migration output from Artisan...",
  "timestamp": "2024-06-14T13:30:00+00:00"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Unauthorized. Invalid deployment token."
}
```

**Error Response (500):**
```json
{
  "success": false,
  "message": "Migration failed: error details...",
  "timestamp": "2024-06-14T13:30:00+00:00"
}
```

---

### 2. Clear Cache

**Endpoint:** `POST /api/deploy/cache-clear`

**Description:** Clears all application caches (cache, config, route, view).

**Authentication:** Same as migrations endpoint

**Example Request:**
```bash
curl -X POST https://your-domain.com/api/deploy/cache-clear \
  -H "X-Deployment-Token: your_token_here"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "All caches cleared successfully",
  "results": {
    "cache": "Application cache cleared!",
    "config": "Configuration cache cleared!",
    "route": "Route cache cleared!",
    "view": "Compiled views cleared!"
  },
  "timestamp": "2024-06-14T13:30:00+00:00"
}
```

---

### 3. Deployment Status

**Endpoint:** `GET /api/deploy/status`

**Description:** Returns current deployment status and environment information.

**Authentication:** Same as migrations endpoint

**Example Request:**
```bash
curl https://your-domain.com/api/deploy/status \
  -H "X-Deployment-Token: your_token_here"
```

**Success Response (200):**
```json
{
  "success": true,
  "environment": "production",
  "debug_mode": false,
  "app_url": "https://your-domain.com",
  "database_connection": "mysql",
  "php_version": "8.2.0",
  "laravel_version": "10.x",
  "timestamp": "2024-06-14T13:30:00+00:00"
}
```

---

## CI/CD Integration Examples

### GitHub Actions

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Your deployment steps here
          
      - name: Run migrations
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/deploy/migrate \
            -H "X-Deployment-Token: ${{ secrets.DEPLOYMENT_TOKEN }}" \
            -f || exit 1
            
      - name: Clear cache
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/deploy/cache-clear \
            -H "X-Deployment-Token: ${{ secrets.DEPLOYMENT_TOKEN }}" \
            -f || exit 1
```

### GitLab CI

```yaml
deploy:
  stage: deploy
  script:
    - # Your deployment steps here
    - |
      curl -X POST ${APP_URL}/api/deploy/migrate \
        -H "X-Deployment-Token: ${DEPLOYMENT_TOKEN}" \
        -f || exit 1
    - |
      curl -X POST ${APP_URL}/api/deploy/cache-clear \
        -H "X-Deployment-Token: ${DEPLOYMENT_TOKEN}" \
        -f || exit 1
  only:
    - main
```

### Manual Deployment Script

```bash
#!/bin/bash

# deployment.sh
DEPLOYMENT_TOKEN="your_token_here"
APP_URL="https://your-domain.com"

echo "Running migrations..."
RESPONSE=$(curl -s -X POST "${APP_URL}/api/deploy/migrate" \
  -H "X-Deployment-Token: ${DEPLOYMENT_TOKEN}")

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✓ Migrations completed successfully"
else
  echo "✗ Migration failed"
  echo "$RESPONSE"
  exit 1
fi

echo "Clearing cache..."
RESPONSE=$(curl -s -X POST "${APP_URL}/api/deploy/cache-clear" \
  -H "X-Deployment-Token: ${DEPLOYMENT_TOKEN}")

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✓ Cache cleared successfully"
else
  echo "✗ Cache clear failed"
  echo "$RESPONSE"
  exit 1
fi

echo "Deployment complete!"
```

---

## Security Best Practices

1. **Use HTTPS:** Always use HTTPS in production to protect the token in transit
2. **Rotate tokens:** Periodically rotate your deployment token
3. **Restrict access:** Only share the token with authorized CI/CD systems
4. **Monitor logs:** Check application logs for unauthorized access attempts
5. **Use headers:** Prefer using the `X-Deployment-Token` header over query parameters to avoid token exposure in logs

---

## Logging

All deployment endpoint activities are logged:
- Successful migrations
- Failed migrations with error details
- Unauthorized access attempts with IP addresses
- Cache clearing operations

Check your Laravel logs at `storage/logs/laravel.log` for deployment activity.

---

## Troubleshooting

### "Unauthorized. Invalid deployment token"
- Verify the token in your `.env` file matches the one you're sending
- Run `php artisan config:clear` to clear cached config
- Check that the token doesn't have extra spaces or quotes

### "Migration failed"
- Check database connection settings
- Verify database user has proper permissions
- Review the error message in the response
- Check `storage/logs/laravel.log` for detailed error traces

### Connection timeout
- Increase timeout settings in your HTTP client
- Check server resources (CPU, memory)
- Verify the application is running and accessible
