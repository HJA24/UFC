import { Component, inject, signal } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { Router } from "@angular/router";

import { AuthService } from "../../../services/auth.service";
import { ForgotPasswordRequestDto } from "../../../models/auth/forgot-password.dto";


@Component({
  selector: 'app-forgot-password-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './forgot-password-form.component.html',
  styleUrl: './forgot-password-form.component.css',
})
export class ForgotPasswordFormComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
  });

  readonly submitSuccess = signal<string | null>(null);
  readonly submitError = signal<string | null>(null);
  readonly loading = signal(false);

  submit() {
    this.submitError.set(null);
    this.submitSuccess.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request: ForgotPasswordRequestDto = {
      email: this.form.controls.email.value
    };

    this.loading.set(true);

    this.auth.forgotPassword(request).subscribe({
      next: () => {
        this.loading.set(false);
        this.submitSuccess.set(`If an account exists for this email, you’ll receive an email shortly`);
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);

        this.submitError.set('Something went wrong. Please try again');
        console.error(err);
      },
    });
  }
}
