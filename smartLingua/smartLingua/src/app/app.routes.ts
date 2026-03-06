import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { FrontLayoutComponent } from './front-office/layout/front-layout.component';
import { HomeComponent } from './front-office/home/home.component';

export const routes: Routes = [
    {
        path: '',
        component: FrontLayoutComponent,
        children: [
            {
                path: '',
                component: HomeComponent,
            },
            {
                path: 'login',
                loadComponent: () =>
                    import('./front-office/login/login.component').then(m => m.LoginComponent),
            },
            {
                path: 'register',
                loadComponent: () =>
                    import('./front-office/register/register.component').then(m => m.RegisterComponent),
            },
            {
                path: 'courses',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('./front-office/courses/course-list/course-list.component').then(m => m.CourseListComponent),
            },
            {
                path: 'chat',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('./front-office/chat/chat.component').then(m => m.ChatComponent),
            },
        ],
    },
    {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () =>
            import('./back-office/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full',
            },
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./back-office/dashboard/dashboard.component').then(m => m.DashboardComponent),
            },
        ],
    },
    {
        path: 'debug',
        loadComponent: () =>
            import('./debug-page.component').then(m => m.DebugPageComponent),
    },
    { path: '**', redirectTo: '' },
];
