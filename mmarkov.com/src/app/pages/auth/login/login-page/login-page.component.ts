import { Component } from '@angular/core';
import { RouterLink } from "@angular/router";
import { LoginFormComponent } from "../../../../components/forms/login-form/login-form.component";

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    LoginFormComponent,
    RouterLink
  ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.css',
})
export class LoginPageComponent {

}
