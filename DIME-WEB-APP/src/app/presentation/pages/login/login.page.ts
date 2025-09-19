import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.css'
})
export class LoginPage {
  protected readonly isSubmitting = signal(false);
  protected readonly logoPath = '/images/AC.MX_logo.png';
  protected form: FormGroup<{
    username: FormControl<string>;
    password: FormControl<string>;
  }>;

  constructor(private readonly formBuilder: FormBuilder) {
    this.form = this.formBuilder.nonNullable.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    // TODO: integrate corporate auth service here
    setTimeout(() => {
      this.isSubmitting.set(false);
      // For now, just log the credentials structure (never real passwords)
      // In production, call an authentication use-case from the domain layer
      console.log('login attempt', {
        username: this.form.value.username,
        // never log passwords
      });
    }, 600);
  }
}


