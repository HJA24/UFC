import { CommonModule } from '@angular/common';
import {ChangeDetectionStrategy, Component, inject, signal} from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Router } from "@angular/router";
import { AuthService } from "../../../services/auth.service";
import { VerifyAccountRequestDto } from "../../../models/auth/verify-account.dto";
import { HttpErrorResponse } from "@angular/common/http";

@Component({
  selector: 'app-verify-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule],
  templateUrl: './verify-form.component.html',
  styleUrl: './verify-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyFormComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly otpLength = 6;
  readonly email = signal<string | null>(
  history.state?.email ?? null
  );

  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly form = new FormGroup({
    otp: new FormArray<FormControl<string>>(
      Array.from({ length: this.otpLength }, () =>
        new FormControl('', {
          nonNullable: true,
          validators: [Validators.required, Validators.pattern(/^\d$/)],
        })
      )
    ),
  });

  // ✅ what your template should iterate over: *ngFor="let ctrl of otpControls; let i = index"
  get otpControls() {
    return this.otpArray.controls;
  }

  get otpArray() {
    return this.form.get('otp') as FormArray<FormControl<string>>;
  }

  submit() {
    this.submitError.set(null);

    if (this.form.invalid) {
      this.otpArray.markAllAsTouched();
      return;
    }

    const otp = this.otpControls.map(c => c.value).join('');

    const request: VerifyAccountRequestDto = {
      email: this.email()!,
      otp: otp
    }

    this.submitting.set(true);

    this.auth.verifyAccount(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        console.error(err);
        this.submitting.set(false);
        this.submitError.set(err?.error?.message ?? 'Registration failed');
      }
    });
  }

  onInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    const digit = (input.value ?? '').replace(/\D/g, '').slice(0, 1);

    // keep the control as a single digit
    this.otpControls[index].setValue(digit);

    // ensure the input shows what we stored (since we sanitize)
    input.value = digit;

    // move to next input automatically
    if (digit && index < this.otpLength - 1) {
      const next = input.parentElement?.querySelectorAll<HTMLInputElement>('input.otp-input')[index + 1];
      next?.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Backspace') {
      // if current is empty, move back
      if (!input.value && index > 0) {
        const prev = input.parentElement?.querySelectorAll<HTMLInputElement>('input.otp-input')[index - 1];
        prev?.focus();
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      const prev = input.parentElement?.querySelectorAll<HTMLInputElement>('input.otp-input')[index - 1];
      prev?.focus();
      event.preventDefault();
      return;
    }

    if (event.key === 'ArrowRight' && index < this.otpLength - 1) {
      const next = input.parentElement?.querySelectorAll<HTMLInputElement>('input.otp-input')[index + 1];
      next?.focus();
      event.preventDefault();
      return;
    }
  }

  onPaste(event: ClipboardEvent) {
    event.preventDefault();

    const text = event.clipboardData?.getData('text') ?? '';
    const digits = text.replace(/\D/g, '').slice(0, this.otpLength).split('');

    digits.forEach((d, i) => {
      this.otpControls[i].setValue(d);
    });


    const nextIndex = Math.min(digits.length, this.otpLength - 1);
    const inputs = (event.target as HTMLElement).querySelectorAll<HTMLInputElement>('input.otp-input');
    inputs[nextIndex]?.focus();
  }
}
