import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { FightcardTabsComponent } from "../../../components/tabs/fightcard/fightcard-tabs.component";

@Component({
  selector: 'app-fightcards-page',
  standalone: true,
  imports: [
    RouterOutlet,
    FightcardTabsComponent
  ],
  templateUrl: './fightcards-page.component.html',
  styleUrl: './fightcards-page.component.css',
})
export class FightcardsPageComponent {

}
