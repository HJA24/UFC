import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ResetPasswordFormComponent } from '../../../components/forms/reset-form/reset-password-form.component';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [
    CommonModule,
    ResetPasswordFormComponent
  ],
  templateUrl: './reset-password-page.component.html',
  styleUrls: ['./reset-password-page.component.css'],
})
export class ResetPasswordPageComponent {}
