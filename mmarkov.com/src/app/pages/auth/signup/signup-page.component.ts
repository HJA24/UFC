import { Component } from '@angular/core';
import { SignupFormComponent } from "../../../components/forms/signup-form/signup-form.component";
import {RouterLink} from "@angular/router";

@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [
    SignupFormComponent,
    RouterLink
  ],
  templateUrl: './signup-page.component.html',
  styleUrl: './signup-page.component.css',
})
export class SignupPageComponent {
}
