import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../environment/environment';

@Component({
  selector: 'app-environment-debug',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="debug-panel">
      <h3>🔧 Environment Debug Information</h3>
      <div class="debug-section">
        <h4>Environment Variables Status:</h4>
        <ul>
          <li>
            <strong>Client ID:</strong> 
            <span [class]="clientId ? 'success' : 'error'">
              {{ clientId ? '✅ Set' : '❌ Missing' }}
            </span>
            <code>{{ clientId || 'undefined' }}</code>
          </li>
          <li>
            <strong>Authority:</strong> 
            <span [class]="authority ? 'success' : 'error'">
              {{ authority ? '✅ Set' : '❌ Missing' }}
            </span>
            <code>{{ authority || 'undefined' }}</code>
          </li>
          <li>
            <strong>Redirect URI:</strong> 
            <span [class]="redirectUri ? 'success' : 'error'">
              {{ redirectUri ? '✅ Set' : '❌ Missing' }}
            </span>
            <code>{{ redirectUri || 'undefined' }}</code>
          </li>
          <li>
            <strong>Known Authorities:</strong> 
            <span [class]="knownAuthorities && knownAuthorities.length > 0 ? 'success' : 'error'">
              {{ knownAuthorities && knownAuthorities.length > 0 ? '✅ Set' : '❌ Missing' }}
            </span>
            <code>{{ knownAuthorities | json }}</code>
          </li>
        </ul>
      </div>
      
      <div class="debug-section">
        <h4>Required Environment Variables:</h4>
        <code>
          NG_APP_AZURE_CLIENT_ID=your-client-id<br>
          NG_APP_AZURE_AUTHORITY_DOMAIN=your-tenant.b2clogin.com<br>
          NG_APP_AZURE_TENANT_NAME=your-tenant.onmicrosoft.com<br>
          NG_APP_AZURE_LOGIN_USER_FLOW=B2C_1_signin<br>
          NG_APP_AZURE_REDIRECT_URI=http://localhost:4200/auth-callback
        </code>
      </div>
    </div>
  `,
  styles: [`
    .debug-panel {
      margin: 20px;
      padding: 20px;
      border: 2px solid #fbbf24;
      border-radius: 8px;
      background: #fffbeb;
      font-family: monospace;
    }
    .debug-section {
      margin: 16px 0;
    }
    .success {
      color: #059669;
      font-weight: bold;
    }
    .error {
      color: #dc2626;
      font-weight: bold;
    }
    code {
      background: #f3f4f6;
      padding: 2px 4px;
      border-radius: 4px;
      margin-left: 8px;
    }
    ul {
      list-style: none;
      padding: 0;
    }
    li {
      margin: 8px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class EnvironmentDebugComponent {
  clientId = environment.msal.clientId;
  authority = environment.msal.authority;
  redirectUri = environment.msal.redirectUri;
  knownAuthorities = environment.msal.knownAuthorities;
}
