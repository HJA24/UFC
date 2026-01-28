import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IconsService } from './services/icons.service'
import { NavbarComponent } from './components/navbar/navbar.component';


@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        RouterOutlet,
        NavbarComponent
    ],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent {
    constructor(private _icons: IconsService) {}

}
