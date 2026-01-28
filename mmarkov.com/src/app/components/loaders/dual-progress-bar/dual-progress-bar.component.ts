import { Component, input } from '@angular/core';
import { CommonModule } from "@angular/common";
import { ProgressBarComponent } from "../progress-bar/progress-bar.component";

@Component({
  selector: 'app-dual-progress-bar',
  standalone: true,
  imports: [
    CommonModule,
    ProgressBarComponent
  ],
  templateUrl: './dual-progress-bar.component.html',
  styleUrl: './dual-progress-bar.component.css',
})
export class DualProgressBarComponent {
  loading = input<boolean>(true)
}
