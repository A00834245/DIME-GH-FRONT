export const environment = {
  production: false,
  googleMapsApiKey: process.env['NG_APP_GOOGLE_MAPS_API_KEY'] || '',
  googleMapId: process.env['NG_APP_GOOGLE_MAP_ID'] || '',
  googleDatasetId: process.env['NG_APP_GOOGLE_DATASET_ID'] || '',
  googleStyleId: process.env['NG_APP_GOOGLE_STYLE_ID'] || ''
};
