import { Component, inject } from '@angular/core';
import { StrawweightPageComponent } from './strawweight/strawweight-page.component';
import { LightweightPageComponent } from './lightweight/lightweight-page.component';
import { MiddleweightPageComponent } from './middleweight/middleweight-page.component';
import { HeavyweightPageComponent } from './heavyweight/heavyweight-page.component';
import { IndentedTreeComponent } from '../../components/tree/indented-tree/indented-tree.component';
import { TiersTabsComponent } from '../../components/tabs/tiers/tiers-tabs.component';
import { TiersService } from '../../services/tiers.service';

@Component({
    selector: 'app-tiers-page',
    imports: [
      StrawweightPageComponent,
      LightweightPageComponent,
      MiddleweightPageComponent,
      HeavyweightPageComponent,
      IndentedTreeComponent,
      TiersTabsComponent
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
}
