import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

import { ContactRequestDto } from "../../../models/contact.dto";
import { ContactService } from "../../../services/contact.service";
import {HttpErrorResponse} from "@angular/common/http";

@Component({
    selector: 'app-contact-form',
    standalone: true,
    imports: [
      ReactiveFormsModule,
      MatFormFieldModule,
      MatInputModule,
      MatButtonModule,
    ],
    templateUrl: './contact-form.component.html',
    styleUrl: './contact-form.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactFormComponent {
  private contact = inject(ContactService)

  readonly form = new FormGroup(
    {
      name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      email: new FormControl('', { nonNullable: true,validators: [Validators.required] }),
      message: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(256)] })
    }
  );

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

    const request: ContactRequestDto = {
      name: this.f.name.value.trim(),
      email: this.f.email.value.trim(),
      message: this.f.message.value,
    };

    this.submitting.set(true);

    this.contact.contact(request).subscribe( {
      next: () => {
        this.submitting.set(false);
      },
      error: (err: HttpErrorResponse) => {
        console.log(err);
        this.submitting.set(false);
        this.submitError.set(
          err?.error?.message ?? 'Something went wrong'
        );
      }
    });
  }
}
