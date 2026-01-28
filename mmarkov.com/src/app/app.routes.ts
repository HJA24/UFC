import { Routes } from '@angular/router';
import { HomePageComponent } from "./pages/home/home-page.component";
import { TiersPageComponent } from "./pages/tiers/tiers-page.component";
import { VerifyAccountPageComponent } from "./pages/auth/verify-account/verify-account-page.component";
import { EventsPageComponent } from "./pages/events/events-page.component";
import { NetworkPageComponent } from "./pages/fight/network/network-page.component";
import { JudgingPageComponent } from "./pages/fight/judging/judging-page.component";
import { PredictionsPageComponent } from "./pages/fight/predictions/predictions-page.component";
import { StatsPageComponent } from "./pages/fight/stats/stats-page.component";
import { ContactPageComponent } from "./pages/contact/contact-page.component";
import { LoginPageComponent } from "./pages/auth/login/login-page/login-page.component";
import { SignupPageComponent } from "./pages/auth/signup/signup-page.component";
import { TermsAndConditionsPageComponent } from "./pages/legal/terms-and-conditions/terms-and-conditions-page.component";
import { CookiesPolicyPageComponent } from "./pages/legal/cookies-policy/cookies-policy-page.component";
import { ForgotPasswordPageComponent } from "./pages/auth/forgot-password/forgot-password-page.component";
import { ResetPasswordPageComponent } from "./pages/auth/reset-password/reset-password-page.component";
import { FightcardsPageComponent } from "./pages/events/fightcards/fightcards-page.component";
import { FightPageComponent } from "./pages/fight/fight-page.component";
import { AboutPageComponent } from "./pages/about/about-page/about-page.component";
import { PricingPageComponent } from "./pages/pricing/pricing-page/pricing-page.component";



export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'sign-up', component: SignupPageComponent },
  { path: 'verify-account', component: VerifyAccountPageComponent },
  { path: 'about', component: AboutPageComponent},
  { path: 'reset-password',
    component: ForgotPasswordPageComponent,
    children: [
      { path: ':token', component: ResetPasswordPageComponent }
    ]
  },
  { path: 'contact-us', component: ContactPageComponent },
  { path: 'terms-and-conditions', component: TermsAndConditionsPageComponent },
  { path: 'cookies-policy', component: CookiesPolicyPageComponent },
  { path: 'tiers', component: TiersPageComponent },
  {
    path: 'events',
    children: [
      { path: '', redirectTo: 'upcoming', pathMatch: 'full' },
      { path: 'upcoming', component: EventsPageComponent, data: { tab: 'upcoming' } },
      { path: 'historical', component: EventsPageComponent, data: { tab: 'historical' } },
      {
        path: ':eventId',
        children: [
          { path: '', redirectTo: 'main', pathMatch: 'full' },
          { path: ':fightCard', component: FightcardsPageComponent },
        ],
      },
    ],
  },
  {
    path: 'fights/:fightId',
    component: FightPageComponent,
    data: { hideNavbar: true },
    children:[
      { path: '', redirectTo: 'stats', pathMatch: 'full' },
      { path: 'network', component: NetworkPageComponent },
      { path: 'stats', component: StatsPageComponent },
      { path: 'predictions', component: PredictionsPageComponent },
      { path: 'judging', component: JudgingPageComponent },
    ]
  },
  { path: 'pricing', component: PricingPageComponent }
]
