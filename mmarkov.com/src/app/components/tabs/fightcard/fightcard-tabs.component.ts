import { Component, input, output } from '@angular/core';

type FightcardTab = 'early-prelim' | 'prelim' | 'main';

const TABS: FightcardTab[] = ['early-prelim', 'prelim', 'main'];

@Component({
  selector: 'app-fightcard-tabs',
  standalone: true,
  imports: [],
  templateUrl: './fightcard-tabs.component.html',
  styleUrl: './fightcard-tabs.component.scss',
})
export class FightcardTabsComponent {
  activeTab = input.required<FightcardTab>();
  tabChange = output<FightcardTab>();

  get activeIndex(): number {
    return TABS.indexOf(this.activeTab());
  }

  onTabClick(tab: FightcardTab): void {
    this.tabChange.emit(tab);
  }
}
