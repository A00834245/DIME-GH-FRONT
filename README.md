# DIME Web Application

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.2. It provides a secure, authenticated interactive map interface with custom marker clustering and category filtering functionality.

## Quick Start

1. **Install dependencies**: `npm install`
2. **Set up environment variables**: Create a `.env` file in the project root and add your Google Maps and Azure AD B2C credentials (see [Environment Setup](#environment-setup) below)
3. **Start the development server**: `npm start`
4. **Open your browser** and go to `http://localhost:4200`
5. **Authenticate**: You will be redirected to Azure AD B2C login to access the application

## Authentication

This application uses **Azure AD B2C** for authentication. All routes except the login page are protected and require authentication. Users must successfully authenticate through Azure AD B2C before accessing the map and profile features.

**Important**: Authentication is always required. This ensures consistent security across all environments.

## Prerequisites

Before running the application, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (LTS version recommended, v18+)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)
- [Angular CLI](https://angular.io/cli): Install globally using `npm install -g @angular/cli`

## Environment Setup

Create a `.env` file in the project root with the following variables:

```
# Google Maps
NG_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NG_APP_GOOGLE_MAP_ID=your_map_id
NG_APP_GOOGLE_DATASET_ID=your_dataset_id
NG_APP_GOOGLE_STYLE_ID=your_style_id
NG_APP_GOOGLE_PROJECT_ID=your_project_id

# Azure AD B2C (see ENVIRONMENT-SETUP.md for details)
NG_APP_AZURE_CLIENT_ID=your-client-id-from-azure-portal
NG_APP_AZURE_AUTHORITY_DOMAIN=yourtenant.b2clogin.com
NG_APP_AZURE_TENANT_NAME=yourtenant.onmicrosoft.com
NG_APP_AZURE_LOGIN_USER_FLOW=your_login_user_flow
NG_APP_AZURE_REDIRECT_URI=http://localhost:4200/auth-callback
```

## Installation

To install all dependencies, run:

```bash
npm install
```

## Development server

To start a local development server, run:

```bash
npm start
# or
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Features

This application includes the following key features:

- **Azure AD B2C Authentication**: Secure authentication using Microsoft Azure AD B2C with protected routes
- **Interactive Google Maps Integration**: Fully integrated Google Maps with custom styling
- **Custom Markers**: Three distinct marker types with professional SVG designs:
  - Parking markers (Blue pin with 'P' icon)
  - CEDI/Warehouse markers (Green warehouse icon)
  - Client markers (Orange building icon)
- **Marker Clustering**: Automatic clustering of markers for better performance and visualization
- **Category Filtering**: Interactive filter boxes to show/hide marker categories with additive selection
- **Responsive Design**: Optimized for different screen sizes and devices
- **SVG Caching**: Optimized marker rendering with cached SVG templates
- **Route Protection**: MsalGuard protects sensitive routes (map, profile) requiring authentication

## Available Scripts

The following scripts are available via npm:

- `npm start` - Starts the development server
- `npm run build` - Builds the app for production
- `npm run watch` - Builds the app in development mode with file watching
- `npm test` - Runs unit tests
- `npm run serve:ssr:DIME-WEB-APP` - Serves the server-side rendered version

## Building

To build the project for production, run:

```bash
npm run build
# or
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

For development build with watch mode:

```bash
npm run watch
```

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── config/
│   │   │   ├── app.config.ts        # Application providers (including MSAL)
│   │   │   ├── app.routes.ts        # Route configuration with MsalGuard
│   │   │   └── msal-config.ts       # MSAL/Azure AD B2C configuration
│   │   ├── environments/
│   │   │   ├── environment.ts       # Development environment config
│   │   │   └── environment.prod.ts  # Production environment config
│   │   ├── guards/                  # Route guards (authentication)
│   │   └── services/
│   │       ├── auth.service.ts      # Authentication service (MSAL wrapper)
│   │       └── logging.service.ts   # Logging service
│   ├── features/
│   │   ├── login/                   # Login page and authentication flow
│   │   ├── map/                     # Map feature with markers and filtering
│   │   └── profile/                 # User profile feature
│   ├── layouts/                      # Layout components (header, etc.)
│   ├── shared/                      # Shared components and utilities
│   ├── app.ts                       # Root application component
│   └── app.html                     # Root template
├── assets/                          # Static assets (images, icons, etc.)
└── styles.css                       # Global styles
```

## Troubleshooting

See ENVIRONMENT-SETUP.md for Azure B2C specifics.

### Common Issues

**Issue: Redirected to login immediately or unable to access map/profile**
- Ensure your `.env` file contains all required Azure AD B2C credentials
- Verify that the redirect URI in Azure portal matches your local URL (`http://localhost:4200`)
- Check browser console for authentication errors
- Ensure you have a valid user account in your Azure AD B2C tenant
- Authentication is required - there is no bypass mode

**Issue: "MSAL not available" or authentication errors**
- Verify all Azure AD B2C environment variables are set correctly in `.env`
- Ensure `NG_APP_AZURE_REDIRECT_URI` matches your current URL
- Check that your Azure AD B2C application is properly configured
- Verify user flow name matches the one configured in Azure portal

**Issue: Google Maps not loading**
- Ensure your `.env` file contains valid Google Maps API credentials
- Verify that the Google Maps JavaScript API is enabled in your Google Cloud Console
- Check that your API key has the necessary permissions
- Note: You must authenticate first before accessing the map

**Issue: Markers not appearing**
- Verify that your Google Maps API key has access to the Maps JavaScript API
- Check the browser console for any JavaScript errors
- Ensure the map component is properly initialized
- Ensure you are authenticated (authentication is required to view the map)

**Issue: Build errors**
- Run `npm install` to ensure all dependencies are installed
- Clear the node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check that all TypeScript files have proper syntax
- Verify all environment variables are set (especially Azure AD B2C variables)

**Issue: Port 4200 already in use**
- Use a different port: `ng serve --port 4201`
- Or stop other processes using port 4200
- Remember to update `NG_APP_AZURE_REDIRECT_URI` if you change the port

## Getting Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Maps JavaScript API
4. Create credentials (API key)
5. Configure the API key restrictions as needed
6. Add the API key to your `.env` file

## Additional Resources

- [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli)
- [Angular Google Maps Documentation](https://github.com/angular/components/tree/main/src/google-maps)
- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [MarkerClusterer Documentation](https://googlemaps.github.io/js-markerclusterer/)
- [Azure AD B2C Documentation](https://docs.microsoft.com/en-us/azure/active-directory-b2c/)
- [MSAL Angular Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular)

