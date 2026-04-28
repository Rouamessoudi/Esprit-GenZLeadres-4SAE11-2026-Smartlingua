import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { studentGuard } from './guards/student.guard';
import { teacherGuard } from './guards/teacher.guard';

export const routes: Routes = [
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./shared/components/role-dashboard-redirect.component').then(
                m => m.RoleDashboardRedirectComponent
            ),
    },
    {
        path: 'student',
        canActivate: [studentGuard],
        loadComponent: () =>
            import('./front-office/dashboard/student-dashboard-layout.component').then(
                m => m.StudentDashboardLayoutComponent
            ),
        children: [
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./front-office/dashboard/student-dashboard-home.component').then(
                        m => m.StudentDashboardHomeComponent
                    ),
            },
            {
                path: 'courses',
                loadComponent: () =>
                    import('./front-office/courses/course-list/course-list.component').then(m => m.CourseListComponent),
            },
            {
                path: 'forum',
                loadComponent: () =>
                    import('./front-office/forum/forum-page.component').then(m => m.ForumPageComponent),
            },
            {
                path: 'forum/:id',
                loadComponent: () =>
                    import('./front-office/forum/forum-detail.component').then(m => m.ForumDetailComponent),
            },
            {
                path: 'announcements',
                loadComponent: () =>
                    import('./front-office/announcements/announcements-list.component').then(
                        m => m.AnnouncementsListComponent
                    ),
            },
            {
                path: 'announcements/new',
                loadComponent: () =>
                    import('./front-office/announcements/announcement-new.component').then(
                        m => m.AnnouncementNewComponent
                    ),
            },
            {
                path: 'announcements/:id',
                loadComponent: () =>
                    import('./front-office/announcements/announcement-detail.component').then(
                        m => m.AnnouncementDetailComponent
                    ),
            },
            {
                path: 'notifications',
                loadComponent: () =>
                    import('./front-office/notifications/notifications-page.component').then(
                        m => m.NotificationsPageComponent
                    ),
            },
            {
                path: 'quiz',
                loadComponent: () =>
                    import('./front-office/quiz/quiz-page.component').then(m => m.QuizPageComponent),
            },
            {
                path: 'exams',
                loadComponent: () =>
                    import('./front-office/dashboard/module-placeholder.component').then(
                        m => m.ModulePlaceholderComponent
                    ),
                data: { title: 'Exams / Certifications Module', icon: 'workspace_premium' },
            },
            {
                path: 'messaging',
                loadComponent: () =>
                    import('./front-office/messaging/messaging-page.component').then(
                        m => m.MessagingPageComponent
                    ),
                data: { title: 'Messaging Module', icon: 'chat' },
            },
            {
                path: 'rewards',
                loadComponent: () =>
                    import('./front-office/payment/payment-page.component').then(m => m.PaymentPageComponent),
            },
            {
                path: 'learning-path',
                loadComponent: () =>
                    import('./front-office/adaptive/adaptive-learning-path.component').then(m => m.AdaptiveLearningPathComponent),
            },
            {
                path: 'adaptive/course/:courseId/learning-plan',
                loadComponent: () =>
                    import('./front-office/adaptive/adaptive-course-learning-plan.component').then(
                        m => m.AdaptiveCourseLearningPlanComponent
                    ),
            },
            {
                path: 'adaptive/mon-niveau',
                loadComponent: () =>
                    import('./front-office/adaptive/current-level-page.component').then(m => m.CurrentLevelPageComponent),
            },
            {
                path: 'progression',
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
                loadComponent: () =>
                    import('./front-office/adaptive/adaptive-level-test.component').then(m => m.AdaptiveLevelTestComponent),
            },
            {
                path: 'payment',
                redirectTo: 'rewards',
                pathMatch: 'full',
            }
        ],
    },
    {
        path: 'teacher',
        canActivate: [teacherGuard],
        loadComponent: () =>
            import('./teacher-office/teacher-dashboard-layout.component').then(m => m.TeacherDashboardLayoutComponent),
        children: [
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./teacher-office/teacher-dashboard-home.component').then(m => m.TeacherDashboardHomeComponent),
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
                path: 'students',
                loadComponent: () =>
                    import('./back-office/users/admin-users.component').then(m => m.AdminUsersComponent),
            },
            {
                path: 'messaging',
                loadComponent: () =>
                    import('./front-office/messaging/messaging-page.component').then(m => m.MessagingPageComponent),
            },
            {
                path: 'forum',
                loadComponent: () =>
                    import('./front-office/forum/forum-page.component').then(m => m.ForumPageComponent),
            },
            {
                path: 'forum/:id',
                loadComponent: () =>
                    import('./front-office/forum/forum-detail.component').then(m => m.ForumDetailComponent),
            },
            {
                path: 'notifications',
                loadComponent: () =>
                    import('./front-office/notifications/notifications-page.component').then(m => m.NotificationsPageComponent),
            },
            {
                path: 'announcements',
                loadComponent: () =>
                    import('./front-office/announcements/announcements-list.component').then(
                        m => m.AnnouncementsListComponent
                    ),
            },
            {
                path: 'announcements/new',
                loadComponent: () =>
                    import('./front-office/announcements/announcement-new.component').then(
                        m => m.AnnouncementNewComponent
                    ),
            },
            {
                path: 'announcements/:id',
                loadComponent: () =>
                    import('./front-office/announcements/announcement-detail.component').then(
                        m => m.AnnouncementDetailComponent
                    ),
            },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
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
                path: 'users',
                loadComponent: () =>
                    import('./back-office/users/admin-users.component').then(m => m.AdminUsersComponent),
            },
            {
                path: 'adaptive',
                loadComponent: () =>
                    import('./back-office/adaptive/teacher-adaptive-dashboard.component').then(m => m.TeacherAdaptiveDashboardComponent),
            },
        ],
    },
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
        ],
    },
    { path: 'learning-path', redirectTo: 'student/learning-path', pathMatch: 'full' },
    { path: 'messaging', redirectTo: 'student/messaging', pathMatch: 'full' },
    { path: 'forum', redirectTo: 'student/forum', pathMatch: 'full' },
    { path: 'announcements', redirectTo: 'student/announcements', pathMatch: 'full' },
    { path: 'notifications', redirectTo: 'student/notifications', pathMatch: 'full' },
    { path: 'quiz', redirectTo: 'student/quiz', pathMatch: 'full' },
    { path: 'adaptive/mon-niveau', redirectTo: 'student/adaptive/mon-niveau', pathMatch: 'full' },
    { path: 'progression', redirectTo: 'student/progression', pathMatch: 'full' },
    { path: 'level-test', redirectTo: 'student/level-test', pathMatch: 'full' },
    { path: '**', redirectTo: '' },
];
