import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl,  FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { AuthService } from "../../../services/auth.service";
import { LoginRequestDto } from "../../../models/auth/login.dto";

@Component({
    selector: 'app-login-form',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatCheckboxModule
    ],
    templateUrl: './login-form.component.html',
    styleUrl: './login-form.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class LoginFormComponent {
  private auth =  inject(AuthService);

  readonly form = new FormGroup(
    {
      email: new FormControl('', { nonNullable: true }),
      password: new FormControl('', { nonNullable: true }),
      rememberMe: new FormControl(false, { nonNullable: true }),
    },
  );
  readonly hidePassword = signal(true);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  get f() {
    return this.form.controls;
  }

  submit() {
    this.submitError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request: LoginRequestDto = {
      email: this.f.email.value.trim(),
      password: this.f.password.value,
      rememberMe: this.f.rememberMe.value
    };

    this.submitting.set(true);

    this.auth.login(request).subscribe({
      next: () => {
        this.submitting.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.log(err);
        this.submitting.set(false);
        this.submitError.set(
          err?.error?.message ?? 'Login failed'
        );
      }
    });
  }
}
