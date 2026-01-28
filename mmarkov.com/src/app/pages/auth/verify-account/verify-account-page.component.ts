import { CommonModule } from "@angular/common";
import { Component } from '@angular/core';
import { VerifyFormComponent } from "../../../components/forms/verify-form/verify-form.component";


@Component({
  selector: 'app-verify-account',
  standalone: true,
  imports: [
    CommonModule,
    VerifyFormComponent
  ],
  templateUrl: './verify-account-page.component.html',
  styleUrls: ['./verify-account-page.component.css'],
})
export class VerifyAccountPageComponent {}
