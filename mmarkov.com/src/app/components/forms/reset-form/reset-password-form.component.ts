import { CommonModule } from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../../../services/auth.service';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmedPassword = group.get('confirmPassword')?.value;
  if (!password || !confirmedPassword) return null;
  return password === confirmedPassword ? null : { passwordMismatch: true };
}


@Component({
  selector: 'app-reset-password-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './reset-password-form.component.html',
  styleUrls: ['./reset-password-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordFormComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly form = new FormGroup(
    {
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(12)],
      }),
      confirmedPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordMatchValidator }
  );

  readonly hidePassword = signal(true);
  readonly hideConfirmedPassword = signal(true);

  readonly token = this.route.snapshot.queryParamMap.get('token');


  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly submitSuccess = signal<string | null>(null);

  get f() { return this.form.controls; }

  readonly showPasswordMismatch = computed(() => {
    const confirmedPassword = this.form.get('confirmedPassword');
    return (
      this.form.hasError('passwordMismatch') &&
      !!confirmedPassword &&
      (confirmedPassword.touched || confirmedPassword.dirty)
    );
  });

  submit() {
    this.submitError.set(null);
    this.submitSuccess.set(null);

    if (!this.token) {
      this.submitError.set('Missing reset token. Please use the link from your email.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.form.hasError('passwordMismatch')) {
      this.form.markAllAsTouched();
      return;
    }

    const request = {
      token: this.token,
      newPassword: this.form.controls.password.value,
    };

    this.submitting.set(true);

    this.auth.resetPassword(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitSuccess.set('Your password has been reset. You can now log in');
        this.router.navigate(['/login']);
      },
      error: () => {
        this.submitting.set(false);
        this.submitError.set('Reset link is invalid or expired');
      },
    });
  }
}
