import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { map, switchMap, distinctUntilChanged, finalize  } from 'rxjs/operators'
import { MatIconButton } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

import { FightMatchupDto } from "src/app/models/fight-matchup.dto";
import { EdgeDto, NodeDto } from "src/app/models/network/graph.dto";
import { PropertiesDto, NetworkPropertyType, NetworkPropertyMeta } from "src/app/models/network/properties.dto";
import { NetworkDto } from "src/app/models/network/network.dto";
import { GraphDataTableComponent } from "src/app/components/tables/graph-data/graph-data-table.component";
import { NetworkService } from "src/app/services/network.service";
import { GraphChartComponent } from "src/app/components/charts/graph/graph-chart.component";
import { NetworkPropertiesComponent } from "src/app/components/charts/network-properties/network-properties.component";
import { FightLoadingService } from "src/app/services/fight-loading.service";

@Component({
  selector: 'app-network-page',
  standalone: true,
  imports: [
    GraphDataTableComponent,
    GraphChartComponent,
    NetworkPropertiesComponent,
    MatIconButton,
    MatIconModule
  ],
  templateUrl: './network-page.component.html',
  styleUrl: './network-page.component.css',
})
export class NetworkPageComponent implements OnInit {
  private route = inject(ActivatedRoute)
  private loadingService = inject(FightLoadingService)
  private networkService = inject(NetworkService)

  matchups: FightMatchupDto[] | null = null
  nodes: NodeDto[] = []
  edges: EdgeDto[] = []
  properties: PropertiesDto | null = null

  activeNodeId = signal<number | null>(null);
  activePos = signal<'circular' | 'cluster'>('circular');
  selectedProperty = signal<NetworkPropertyType | null>(null);

  propertyDescription = computed(() => {
    const property = this.selectedProperty();
    if (!property) return null;
    return NetworkPropertyMeta[property]?.description || null;
  });

  onActiveNodeIdChange(id: number | null) {
    this.activeNodeId.set(id);
  }

  onPosChange(pos: 'circular' | 'cluster') {
    this.activePos.set(pos);
  }

  onPropertySelect(property: NetworkPropertyType | null) {
    this.selectedProperty.set(property);
  }

    ngOnInit(): void {
    this.route.parent!.paramMap.pipe(
      map(params => parseInt(params.get('fightId')!, 10)),
      distinctUntilChanged(),
      switchMap(fightId => {
        this.loadingService.start()
        return this.networkService.getNetwork(fightId).pipe(
          finalize(() => this.loadingService.stop())
        )
      }),
    ).subscribe((network: NetworkDto) => {
      this.matchups = network.graph.data
      this.nodes = network.graph.nodes
      this.edges = network.graph.edges
      this.properties = network.properties
    })
  }
}
