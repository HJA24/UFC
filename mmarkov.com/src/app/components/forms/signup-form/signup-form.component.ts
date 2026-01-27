import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../../../services/auth.service';
import { SignupRequestDto } from '../../../models/auth/signup.dto';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  if (!password || !confirmPassword) return null;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-signup-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './signup-form.component.html',
  styleUrl: './signup-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SignupFormComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly form = new FormGroup(
    {
      firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      lastName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(12)] }),
      confirmPassword: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(12)] }),
    },
    { validators: passwordMatchValidator }
  );

  readonly hidePassword = signal(true);
  readonly hideConfirmedPassword = signal(true);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  get f() {
    return this.form.controls;
  }

  isTouchedOrDirty(control: AbstractControl | null | undefined): boolean {
    return !!control && (control.touched || control.dirty);
  }

  readonly showPasswordMismatch = computed(() => {
    const confirm = this.form.get('confirmPassword');
    return (
      this.form.hasError('passwordMismatch') &&
      !!confirm &&
      (confirm.touched || confirm.dirty)
    );
  });

  submit() {
    this.submitError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request: SignupRequestDto = {
      firstName: this.f.firstName.value,
      lastName: this.f.lastName.value,
      email: this.f.email.value,
      password: this.f.password.value,
    };

    this.submitting.set(true);

    this.auth.signup(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/verify-account'],
          { state: { email: request.email } });
      },
      error: (err: HttpErrorResponse) => {
        console.error(err);
        this.submitting.set(false);
        this.submitError.set(err?.error?.message ?? 'Registration failed');
      }
    });
  }
}
