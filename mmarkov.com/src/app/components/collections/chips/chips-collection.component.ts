import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-chips',
  standalone: true,
  imports: [CommonModule, MatChipsModule],
  templateUrl: './chips-collection.component.html',
  styleUrl: './chips-collection.component.css'
})
export class ChipsCollectionComponent {

}
