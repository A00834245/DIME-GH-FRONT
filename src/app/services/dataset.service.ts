import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DatasetService {
  private backendUrl = 'http://localhost:3000'; // TODO: Configure this in environment
  
  constructor(private http: HttpClient) { }

  /**
   * Fetch dataset directly from Google Maps Platform Datasets API
   * 
   * IMPORTANT: This method currently fails with 401 because:
   * - Datasets API requires OAuth2 or service account authentication
   * - API keys are not supported for this API
   * - Frontend cannot securely handle service account credentials
   * 
   * TODO: MIGRATE TO BACKEND PROXY (REQUIRED)
   * This MUST be moved to backend server:
   * - Backend uses service account authentication
   * - API key won't be exposed to frontend
   * - Better rate limiting and caching
   * - Data transformation/filtering capabilities
   * 
   * Backend endpoint should be: GET /api/dataset
   */
  async fetchDataset(): Promise<any> {
    try {
      console.log('Fetching dataset directly from Google Datasets API...');
      console.log('NOTE: This should be migrated to backend proxy in the future');
      
      const projectId = environment.googleProjectId || 'your-project-id'; // Add this to environment
      const datasetId = environment.googleDatasetId;
      const apiKey = environment.googleMapsApiKey;
      
      // Google Maps Platform Datasets API endpoint for downloading dataset
      const url = `https://mapsplatformdatasets.googleapis.com/v1/projects/${projectId}/datasets/${datasetId}:download?alt=media&key=${apiKey}`;
      
      console.log('Fetching from URL:', url.replace(apiKey, 'API_KEY_HIDDEN'));
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Dataset API error: ${response.status} - ${errorText}`);
      }
      
      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);
      
      // Parse response based on content type
      if (contentType?.includes('application/json')) {
        const geojson = await response.json();
        console.log('Dataset fetched successfully:', geojson);
        return geojson;
      } else {
        // Handle CSV or other formats if needed
        const text = await response.text();
        console.log('Dataset fetched as text:', text.substring(0, 200) + '...');
        
        // For now, assume it should be JSON - may need to parse CSV later
        try {
          return JSON.parse(text);
        } catch (parseError) {
          console.error('Could not parse dataset as JSON:', parseError);
          throw new Error('Dataset format not supported. Expected JSON/GeoJSON.');
        }
      }
      
    } catch (error) {
      console.error('Error fetching dataset:', error);
      throw error;
    }
  }
  
  /**
   * Fetch dataset from backend proxy
   */
  async fetchDatasetFromBackend(): Promise<any> {
    try {
      console.log('Fetching dataset from backend proxy...');
      
      const url = `${this.backendUrl}/api/dataset`;
      console.log('Backend URL:', url);
      
      const geojson: any = await this.http.get(url).toPromise();
      console.log('Dataset fetched successfully from backend:', geojson);
      
      // PRODUCTION MODE: Display all markers from backend
      if (geojson && geojson.features && Array.isArray(geojson.features)) {
        console.log(`Production mode: Displaying all ${geojson.features.length} markers from backend`);
        return geojson;
      }
      
      return geojson;
      
    } catch (error) {
      console.error('Error fetching dataset from backend:', error);
      throw error;
    }
  }
  
}