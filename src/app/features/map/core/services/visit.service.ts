import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Visit {
  id: string;
  userId: string;
  storeId: string;
  storeName: string;
  visitDate: string;
  checkInTimestamp: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  commentStatus: 'pending' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface VisitComment {
  id: string;
  userId: string;
  storeId: string;
  visitId: string | null;
  text: string;
  verified: boolean;
  commentDate: string;
  createdAt: string;
}

export interface PendingVisit {
  visitId: string;
  storeId: string;
  storeName: string;
  checkInTimestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  error?: {
    message: string;
    details: string | null;
    statusCode: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class VisitService {
  private readonly backendUrl = 'http://localhost:3000/api/v2';
  
  // State signals
  private readonly _todayVisits = signal<Visit[]>([]);
  private readonly _pendingVisits = signal<PendingVisit[]>([]);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _lastError = signal<string | null>(null);
  
  // Visits by store for quick lookup
  private readonly _visitsByStore = signal<Map<string, Visit>>(new Map());
  
  // Public readonly signals
  readonly todayVisits = computed(() => this._todayVisits());
  readonly pendingVisits = computed(() => this._pendingVisits());
  readonly pendingCount = computed(() => this._pendingVisits().length);
  readonly isLoading = computed(() => this._isLoading());
  readonly lastError = computed(() => this._lastError());
  readonly hasPendingVisits = computed(() => this._pendingVisits().length > 0);
  
  constructor(private http: HttpClient) {}

  /**
   * Get current user ID (in production, this would come from AuthService)
   */
  private getCurrentUserId(): string {
    // TODO: Integrate with AuthService to get real user ID
    return 'dev-user-001';
  }

  /**
   * Create or reuse a visit for today
   */
  async createOrReuseVisit(
    storeId: string, 
    storeName: string, 
    coordinates: { lat: number; lng: number }
  ): Promise<{ visit: Visit; created: boolean }> {
    this._isLoading.set(true);
    this._lastError.set(null);

    try {
      const userId = this.getCurrentUserId();
      
      const response = await firstValueFrom(
        this.http.post<ApiResponse<{ visit: Visit; created: boolean; message: string }>>(
          `${this.backendUrl}/visits`,
          { userId, storeId, storeName, coordinates }
        )
      );

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to create visit');
      }

      const { visit, created } = response.data;

      // Update local state
      this.updateLocalVisitState(visit);

      console.log(`[VisitService] Visit ${created ? 'created' : 'reused'}: ${visit.id}`);
      
      return { visit, created };

    } catch (error: any) {
      let message = 'Error creating visit';
      
      // Handle HTTP errors from Angular HttpClient
      if (error.status) {
        // If error has ApiResponse format
        if (error.error && typeof error.error === 'object' && 'success' in error.error) {
          const apiError = error.error as ApiResponse<any>;
          if (!apiError.success && apiError.error) {
            message = apiError.error.message || message;
          }
        } else if (error.error?.error?.message) {
          message = error.error.error.message;
        } else if (error.error?.message) {
          message = error.error.message;
        }
      } else if (error.error?.error?.message) {
        message = error.error.error.message;
      } else if (error.error?.message) {
        message = error.error.message;
      } else if (error.message) {
        message = error.message;
      }
      
      this._lastError.set(message);
      console.error('[VisitService] Create visit error:', message);
      throw new Error(message);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Get today's visits for current user
   */
  async fetchTodayVisits(status: 'all' | 'pending' | 'completed' = 'all'): Promise<Visit[]> {
    this._isLoading.set(true);
    this._lastError.set(null);

    try {
      const userId = this.getCurrentUserId();
      
      const response = await firstValueFrom(
        this.http.get<ApiResponse<{ visits: Visit[]; total: number; pending: number; completed: number }>>(
          `${this.backendUrl}/visits`,
          { params: { userId, status } }
        )
      );

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to fetch visits');
      }

      const visits = response.data.visits;
      
      // Update local state
      this._todayVisits.set(visits);
      
      // Update visits by store map
      const visitsByStore = new Map<string, Visit>();
      for (const visit of visits) {
        visitsByStore.set(visit.storeId, visit);
      }
      this._visitsByStore.set(visitsByStore);

      console.log(`[VisitService] Fetched ${visits.length} visits for today`);
      
      return visits;

    } catch (error: any) {
      const message = error.error?.error?.message || error.message || 'Error fetching visits';
      this._lastError.set(message);
      console.error('[VisitService] Fetch visits error:', error);
      return [];
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Get today's visit for a specific store (if exists)
   */
  async getVisitForStore(storeId: string): Promise<Visit | null> {
    // First check local cache
    const cached = this._visitsByStore().get(storeId);
    if (cached) {
      return cached;
    }

    try {
      const userId = this.getCurrentUserId();
      
      const response = await firstValueFrom(
        this.http.get<ApiResponse<{ visit: Visit | null; hasVisitToday: boolean }>>(
          `${this.backendUrl}/visits/store/${storeId}`,
          { params: { userId } }
        )
      );

      if (!response.success) {
        return null;
      }

      const visit = response.data.visit;
      
      if (visit) {
        this.updateLocalVisitState(visit);
      }

      return visit;

    } catch (error: any) {
      console.error('[VisitService] Get store visit error:', error);
      return null;
    }
  }

  /**
   * Check if user has a visit today for a specific store
   */
  hasVisitForStore(storeId: string): boolean {
    return this._visitsByStore().has(storeId);
  }

  /**
   * Get visit for store from local cache
   */
  getVisitForStoreSync(storeId: string): Visit | null {
    return this._visitsByStore().get(storeId) || null;
  }

  /**
   * Fetch pending visits for banner display
   */
  async fetchPendingVisits(): Promise<PendingVisit[]> {
    try {
      const userId = this.getCurrentUserId();
      
      const response = await firstValueFrom(
        this.http.get<ApiResponse<{ pendingVisits: PendingVisit[]; count: number; date: string }>>(
          `${this.backendUrl}/reminders/pending`,
          { params: { userId } }
        )
      );

      if (!response.success) {
        return [];
      }

      const pendingVisits = response.data.pendingVisits;
      this._pendingVisits.set(pendingVisits);

      console.log(`[VisitService] Fetched ${pendingVisits.length} pending visits`);
      
      return pendingVisits;

    } catch (error: any) {
      console.error('[VisitService] Fetch pending visits error:', error);
      return [];
    }
  }

  /**
   * Create a comment for a store
   */
  async createComment(
    storeId: string, 
    text: string, 
    visitId?: string
  ): Promise<{ comment: VisitComment; verified: boolean }> {
    this._isLoading.set(true);
    this._lastError.set(null);

    try {
      const userId = this.getCurrentUserId();
      
      const response = await firstValueFrom(
        this.http.post<ApiResponse<{ comment: VisitComment; verified: boolean; visitUpdated: boolean }>>(
          `${this.backendUrl}/comments`,
          { userId, storeId, text, visitId }
        )
      );

      if (!response.success) {
        throw new Error(response.error?.message || 'Failed to create comment');
      }

      const { comment, verified } = response.data;

      // If comment was verified and visit was updated, refresh visits
      if (response.data.visitUpdated) {
        await this.fetchTodayVisits();
        await this.fetchPendingVisits();
      }

      console.log(`[VisitService] Comment created: ${comment.id}, verified: ${verified}`);
      
      return { comment, verified };

    } catch (error: any) {
      const message = error.error?.error?.message || error.message || 'Error creating comment';
      this._lastError.set(message);
      console.error('[VisitService] Create comment error:', error);
      throw new Error(message);
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Get comments for a store
   */
  async getCommentsForStore(storeId: string, limit: number = 50): Promise<VisitComment[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<{ comments: VisitComment[]; total: number }>>(
          `${this.backendUrl}/comments`,
          { params: { storeId, limit: limit.toString() } }
        )
      );

      if (!response.success) {
        return [];
      }

      return response.data.comments;

    } catch (error: any) {
      console.error('[VisitService] Get comments error:', error);
      return [];
    }
  }

  /**
   * Update local state when a visit changes
   */
  private updateLocalVisitState(visit: Visit): void {
    // Update today's visits array
    const currentVisits = this._todayVisits();
    const existingIndex = currentVisits.findIndex(v => v.id === visit.id);
    
    if (existingIndex >= 0) {
      const updated = [...currentVisits];
      updated[existingIndex] = visit;
      this._todayVisits.set(updated);
    } else {
      this._todayVisits.set([...currentVisits, visit]);
    }

    // Update visits by store map
    const visitsByStore = new Map(this._visitsByStore());
    visitsByStore.set(visit.storeId, visit);
    this._visitsByStore.set(visitsByStore);

    // Update pending visits if status changed
    if (visit.commentStatus === 'completed') {
      const pending = this._pendingVisits().filter(p => p.visitId !== visit.id);
      this._pendingVisits.set(pending);
    }
  }

  /**
   * Initialize service - fetch initial data
   */
  async initialize(): Promise<void> {
    console.log('[VisitService] Initializing...');
    await Promise.all([
      this.fetchTodayVisits(),
      this.fetchPendingVisits()
    ]);
    console.log('[VisitService] Initialization complete');
  }

  /**
   * Clear all local state
   */
  clearState(): void {
    this._todayVisits.set([]);
    this._pendingVisits.set([]);
    this._visitsByStore.set(new Map());
    this._lastError.set(null);
  }
}

