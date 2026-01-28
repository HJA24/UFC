import { Component, inject } from '@angular/core';
import { StrawweightPageComponent } from './strawweight/strawweight-page.component';
import { LightweightPageComponent } from './lightweight/lightweight-page.component';
import { MiddleweightPageComponent } from './middleweight/middleweight-page.component';
import { HeavyweightPageComponent } from './heavyweight/heavyweight-page.component';
import { TiersTabsComponent } from '../../components/tabs/tiers/tiers-tabs.component';
import { TiersService } from '../../services/tiers.service';
import {IndentedTreeComponent} from "src/app/components/tree/indented-tree/indented-tree.component";

@Component({
    selector: 'app-tiers-page',
  imports: [
    StrawweightPageComponent,
    LightweightPageComponent,
    MiddleweightPageComponent,
    HeavyweightPageComponent,
    TiersTabsComponent,
    IndentedTreeComponent
  ],
    templateUrl: './tiers-page.component.html',
    styleUrl: './tiers-page.component.css'
})
export class TiersPageComponent {
  private tiersService = inject(TiersService);

  readonly selectedIndex = this.tiersService.selectedIndex;

  onTabChange(index: number) {
    this.tiersService.selectTier(index);
  }

  onTierClick(index: number) {
    this.tiersService.selectTier(index);
  }
}
