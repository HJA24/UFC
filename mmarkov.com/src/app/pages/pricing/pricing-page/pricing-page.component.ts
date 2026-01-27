import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal, ElementRef, ViewChild } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DecimalPipe } from "@angular/common";
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

import { PRICING_CONFIG, BillingPeriod } from "src/app/config/pricing.config";

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonToggleModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    DecimalPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pricing-page.component.html',
  styleUrls: ['./pricing-page.component.css']
})
export class PricingPageComponent implements OnInit, OnDestroy {
  priceAnimate = false;

  private sub?: Subscription;

  billingPeriod = new FormControl<BillingPeriod>(BillingPeriod.MONTHLY, { nonNullable: true });

  // Carousel state
  currentTierIndex = signal(0);
  readonly totalTiers = 4;

  @ViewChild('tiersContainer') tiersContainer!: ElementRef<HTMLElement>;

  ngOnInit(): void {
    this.sub = this.billingPeriod.valueChanges.subscribe(() => {
      this.priceAnimate = false;
      requestAnimationFrame(() => {
        this.priceAnimate = true;
        setTimeout(() => (this.priceAnimate = false), 220);
      });
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  getPricePerMonth(tier: keyof typeof PRICING_CONFIG): number {
    const period = this.billingPeriod.value;
    return PRICING_CONFIG[tier][period];
  }

  prevTier(): void {
    if (this.currentTierIndex() > 0) {
      this.currentTierIndex.update(i => i - 1);
      this.scrollToCurrentTier();
    }
  }

  nextTier(): void {
    if (this.currentTierIndex() < this.totalTiers - 1) {
      this.currentTierIndex.update(i => i + 1);
      this.scrollToCurrentTier();
    }
  }

  private scrollToCurrentTier(): void {
    const container = this.tiersContainer?.nativeElement;
    if (container) {
      const cardWidth = container.scrollWidth / this.totalTiers;
      container.scrollTo({
        left: cardWidth * this.currentTierIndex(),
        behavior: 'smooth'
      });
    }
  }
}
