import { Injectable } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import { MatIconRegistry } from '@angular/material/icon'

@Injectable({ providedIn: 'root' })
export class IconsService {
  constructor(
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer
  ) {
    const icon = (name: string, path: string) =>
      iconRegistry.addSvgIcon(
        name,
        sanitizer.bypassSecurityTrustResourceUrl(path)
      )

    icon('decisionBlue', 'assets/icons/decisionBlue.svg')
    icon('decisionRed', 'assets/icons/decisionRed.svg')
  }
}
