# Security Documentation for Nudge API

This document outlines the security measures implemented for the Nudge API endpoints.

## Authentication Types

The Nudge API uses two types of authentication:

1. **Firebase Authentication** - For endpoints called from the frontend
2. **Token-based Authentication** - For cron job endpoints

## Frontend API Endpoints

All API endpoints called from the frontend are secured using Firebase Authentication. The frontend automatically adds the Firebase Auth token to all API requests.

### How it works:

1. When a user logs in, the Firebase Auth token is obtained
2. The token is automatically added to the `Authorization` header of all API requests
3. The server verifies the token and extracts the user information
4. If the token is invalid or missing, the request is rejected with a 401 Unauthorized error

### Protected Endpoints:

- `/api/send-whatsapp`
- `/api/message-status`
- `/api/soften`
- `/api/refine`
- And any other endpoints called from the frontend

## Cron Job Endpoints

Cron job endpoints are secured using a token-based authentication system.

### How it works:

1. A secret token is defined in the environment variables (`NUXT_ENV_CRON_SECRET_TOKEN`)
2. The cron job must include this token as a query parameter in the URL
3. The server verifies the token before processing the request
4. If the token is invalid or missing, the request is rejected with a 401 Unauthorized error

### Protected Endpoints:

- `/api/cron/process-queue`
- `/api/process-queue` (internal endpoint called by the cron endpoint)

### Setting up the Cron Job:

When setting up the cron job, you must include the token in the URL:

```
https://your-domain.com/api/cron/process-queue?token=your-secret-token
```

Replace `your-secret-token` with the value of `NUXT_ENV_CRON_SECRET_TOKEN` from your environment variables.

### Example Cron Job Setup:

#### Using Vercel Cron Jobs:

```json
{
  "crons": [
    {
      "path": "/api/cron/process-queue?token=your-secret-token",
      "schedule": "* * * * *"
    }
  ]
}
```

#### Using crontab:

```
* * * * * curl https://your-domain.com/api/cron/process-queue?token=your-secret-token
```

## Environment Variables

To set up the security system, you need to define the following environment variables:

```
# Firebase Admin SDK credentials (for server-side operations)
NUXT_ENV_FIREBASE_ADMIN_CREDENTIALS=<your-firebase-admin-credentials-json>

# Secret token for cron job authentication
NUXT_ENV_CRON_SECRET_TOKEN=<your-secret-token>
```

For production, make sure to use a strong, randomly generated token for `NUXT_ENV_CRON_SECRET_TOKEN`.

## Security Best Practices

1. **Keep your tokens secret** - Never commit tokens to version control or share them publicly
2. **Use HTTPS** - Always use HTTPS to encrypt data in transit
3. **Rotate tokens** - Periodically rotate your cron job token for enhanced security
4. **Monitor logs** - Regularly check logs for unauthorized access attempts
5. **Limit permissions** - Ensure Firebase users only have access to the resources they need
