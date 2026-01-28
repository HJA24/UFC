import { Component } from '@angular/core';
import {ForgotPasswordFormComponent} from "../../../components/forms/forgot-password-form/forgot-password-form.component";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [
    ForgotPasswordFormComponent,
    RouterLink
  ],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './forgot-password-page.component.css',
})
export class ForgotPasswordPageComponent {

}
