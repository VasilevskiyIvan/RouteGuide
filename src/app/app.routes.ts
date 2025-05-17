import { Routes } from '@angular/router';
import { StartPageComponent } from './views/start-page/start-page.component';
import { ProfilePageComponent } from './views/profile-page/profile-page.component';
import { AddRoutePageComponent } from './views/add-route-page/add-route-page.component';
import { SavedPageComponent } from './views/saved-page/saved-page.component';
import { LoginPageComponent } from './views/login-page/login-page.component';
import { RegisterPageComponent } from './views/register-page/register-page.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: "", component: StartPageComponent },
    { path: "login", component: LoginPageComponent },
    { path: "register", component: RegisterPageComponent },
    { path: "profile", component: ProfilePageComponent, canActivate: [AuthGuard] },
    { path: "add-route", component: AddRoutePageComponent, canActivate: [AuthGuard] },
    { path: "saved", component: SavedPageComponent, canActivate: [AuthGuard] },
    { path: "**", redirectTo: "", pathMatch: "full" }
];