import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { moderatorGuard } from './guards/moderator.guard';
import { sessionGuard } from './guards/session.guard';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./front-office/layout/front-layout.component').then(m => m.FrontLayoutComponent),
        children: [
            {
                path: '',
                loadComponent: () =>
                    import('./front-office/home/home.component').then(m => m.HomeComponent),
            },
            {
                path: 'auth/register',
                loadComponent: () =>
                    import('./front-office/auth/register/register.component').then(m => m.RegisterComponent),
            },
            {
                path: 'auth/login',
                loadComponent: () =>
                    import('./front-office/auth/login/login.component').then(m => m.LoginComponent),
            },
            {
                path: 'courses',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('./front-office/courses/course-list/course-list.component').then(m => m.CourseListComponent),
            },
            {
                path: 'forum',
                loadComponent: () =>
                    import('./front-office/forum/forum-list/forum-list.component').then(m => m.ForumListComponent),
            },
            {
                path: 'forum/new',
                canActivate: [sessionGuard],
                loadComponent: () =>
                    import('./front-office/forum/forum-form/forum-form.component').then(m => m.ForumFormComponent),
            },
            {
                path: 'forum/:id',
                canActivate: [sessionGuard],
                loadComponent: () =>
                    import('./front-office/forum/forum-detail/forum-detail.component').then(m => m.ForumDetailComponent),
            },
            {
                path: 'forum/:id/edit',
                canActivate: [sessionGuard],
                loadComponent: () =>
                    import('./front-office/forum/forum-form/forum-form.component').then(m => m.ForumFormComponent),
            },
            {
                path: 'announcements',
                loadComponent: () =>
                    import('./front-office/forum/announcements-list/announcements-list.component').then(m => m.AnnouncementsListComponent),
            },
            {
                path: 'announcements/new',
                canActivate: [sessionGuard],
                loadComponent: () =>
                    import('./front-office/forum/announcement-form/announcement-form.component').then(m => m.AnnouncementFormComponent),
            },
            {
                path: 'announcements/:id/edit',
                canActivate: [sessionGuard],
                loadComponent: () =>
                    import('./front-office/forum/announcement-form/announcement-form.component').then(m => m.AnnouncementFormComponent),
            },
            {
                path: 'announcements/:id',
                canActivate: [sessionGuard],
                loadComponent: () =>
                    import('./front-office/forum/announcement-detail/announcement-detail.component').then(m => m.AnnouncementDetailComponent),
            },
            // Module Notifications & Alertes (liste, filtres, lu/suppression)
            {
                path: 'notifications',
                loadComponent: () =>
                    import('./front-office/notifications/notifications-list/notifications-list.component').then(m => m.NotificationsListComponent),
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
            {
                path: 'users',
                children: [
                    { path: '', loadComponent: () => import('./back-office/users/users-list/users-list.component').then(m => m.UsersListComponent) },
                    { path: 'new', loadComponent: () => import('./back-office/users/user-form/user-form.component').then(m => m.UserFormComponent) },
                    { path: ':id/edit', loadComponent: () => import('./back-office/users/user-form/user-form.component').then(m => m.UserFormComponent) },
                    { path: ':id', loadComponent: () => import('./back-office/users/user-details/user-details.component').then(m => m.UserDetailsComponent) },
                ]
            },
            {
                path: 'forum/moderation',
                canActivate: [moderatorGuard],
                loadComponent: () => import('./back-office/forum/forum-moderation/forum-moderation.component').then(m => m.ForumModerationComponent),
            },
        ],
    },
    { path: '**', redirectTo: '' },
];
