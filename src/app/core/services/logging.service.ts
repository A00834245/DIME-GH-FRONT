import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggingService {
    logEvent(event: string, data?: any): void {
        try {
            console.log('[EVENT]', event, data ?? '');
        } catch {}
    }

    logError(event: string, error?: any): void {
        try {
            console.error('[ERROR]', event, error ?? '');
        } catch {}
    }
}


