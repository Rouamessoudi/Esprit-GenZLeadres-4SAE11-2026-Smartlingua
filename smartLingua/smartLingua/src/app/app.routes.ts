import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

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
                path: 'courses',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('./front-office/courses/course-list/course-list.component').then(m => m.CourseListComponent),
            },
            {
                path: 'learning-path',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('./front-office/adaptive/adaptive-learning-path.component').then(m => m.AdaptiveLearningPathComponent),
            },
            {
                path: 'adaptive/course/:courseId/learning-plan',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('./front-office/adaptive/adaptive-course-learning-plan.component').then(
                        m => m.AdaptiveCourseLearningPlanComponent
                    ),
            },
            {
                path: 'adaptive/mon-niveau',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('./front-office/adaptive/current-level-page.component').then(m => m.CurrentLevelPageComponent),
            },
            {
                path: 'progression',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('./front-office/adaptive/adaptive-progression.component').then(m => m.AdaptiveProgressionComponent),
            },
            {
                path: 'learning-profile',
                redirectTo: 'progression',
                pathMatch: 'full',
            },
            {
                path: 'level-test',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('./front-office/adaptive/adaptive-level-test.component').then(m => m.AdaptiveLevelTestComponent),
            },
            {
                path: 'payment',
                canActivate: [authGuard],
                loadComponent: () =>
                    import('./front-office/payment/payment-page.component').then(m => m.PaymentPageComponent),
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
                path: 'courses',
                loadComponent: () =>
                    import('./back-office/courses/course-list-admin.component').then(m => m.CourseListAdminComponent),
            },
            {
                path: 'courses/new',
                loadComponent: () =>
                    import('./back-office/courses/course-form.component').then(m => m.CourseFormComponent),
            },
            {
                path: 'courses/:id/edit',
                loadComponent: () =>
                    import('./back-office/courses/course-form.component').then(m => m.CourseFormComponent),
            },
            {
                path: 'courses/:id/detail',
                loadComponent: () =>
                    import('./back-office/courses/course-detail.component').then(m => m.CourseDetailComponent),
            },
            {
                path: 'quiz',
                loadComponent: () =>
                    import('./back-office/quiz/admin-quiz-page.component').then(m => m.AdminQuizPageComponent),
            },
            {
                path: 'adaptive',
                loadComponent: () =>
                    import('./back-office/adaptive/teacher-adaptive-dashboard.component').then(m => m.TeacherAdaptiveDashboardComponent),
            },
        ],
    },
    { path: '**', redirectTo: '' },
];
