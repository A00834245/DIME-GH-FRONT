# DIME Web Application

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.2. It provides an interactive map interface with custom marker clustering and category filtering functionality.

## Quick Start

1. **Install dependencies**: `npm install`
2. **Set up environment variables**: Copy `.env.example` to `.env` and add your Google Maps and Azure B2C values
3. **Start the development server**: `npm start`
4. **Open your browser** and go to `http://localhost:4200`

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
NG_APP_AZURE_LOGIN_USER_FLOW=B2C_1_signin
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

- **Interactive Google Maps Integration**: Fully integrated Google Maps with custom styling
- **Custom Markers**: Three distinct marker types with professional SVG designs:
  - Parking markers (Blue pin with 'P' icon)
  - CEDI/Warehouse markers (Green warehouse icon)
  - Client markers (Orange building icon)
- **Marker Clustering**: Automatic clustering of markers for better performance and visualization
- **Category Filtering**: Interactive filter boxes to show/hide marker categories with additive selection
- **Responsive Design**: Optimized for different screen sizes and devices
- **SVG Caching**: Optimized marker rendering with cached SVG templates

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
│   ├── components/
│   │   └── map/              # Main map component with markers and filtering
│   ├── services/             # Angular services for data and API calls
│   ├── models/              # TypeScript interfaces and models
│   └── app.component.*      # Root application component
├── environments/
│   ├── environment.ts       # Development environment configuration
│   └── environment.prod.ts  # Production environment configuration
├── assets/                  # Static assets (images, icons, etc.)
└── styles.css              # Global styles
```

## Troubleshooting

See ENVIRONMENT-SETUP.md for Azure B2C specifics.

### Common Issues

**Issue: Google Maps not loading**
- Ensure your `.env` file contains valid Google Maps API credentials
- Verify that the Google Maps JavaScript API is enabled in your Google Cloud Console
- Check that your API key has the necessary permissions

**Issue: Markers not appearing**
- Verify that your Google Maps API key has access to the Maps JavaScript API
- Check the browser console for any JavaScript errors
- Ensure the map component is properly initialized

**Issue: Build errors**
- Run `npm install` to ensure all dependencies are installed
- Clear the node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check that all TypeScript files have proper syntax

**Issue: Port 4200 already in use**
- Use a different port: `ng serve --port 4201`
- Or stop other processes using port 4200

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
