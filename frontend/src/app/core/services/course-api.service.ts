import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { coursesGatewayPrefix, isNgServe } from '../api-gateway-urls';

const COURSES_API_DIRECT = 'http://localhost:8086/api/courses';
const METIER_API_DIRECT = 'http://localhost:8086/api/metier';

export type CourseLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type ResourceType = 'PDF' | 'VIDEO' | 'AUDIO';

export interface CourseDto {
  id?: number;
  title: string;
  description?: string;
  level: CourseLevel;
  startDate?: string;
  endDate?: string;
  price?: number;
  resources?: ResourceDto[];
  seances?: SeanceDto[];
}

export interface ResourceDto {
  id?: number;
  title: string;
  type: ResourceType;
  url: string;
}

export interface SeanceDto {
  id?: number;
  title: string;
  startDateTime: string;
  durationMinutes: number;
  description?: string;
}

/** Statistiques métier (toujours renvoyées, même à 0) */
export interface StatisticsDto {
  totalCourses: number;
  totalResources: number;
  totalSeances: number;
  coursesByLevel: Record<CourseLevel, number>;
  /** Répartition des ressources par type (PDF, VIDEO, AUDIO) */
  resourcesByType?: Record<ResourceType, number>;
  /** Durée totale (minutes) des séances à venir */
  upcomingSeancesTotalMinutes?: number;
}

/** Résumé métier d'un cours (avec comptages) */
export interface CourseSummaryDto {
  id: number;
  title: string;
  level: CourseLevel;
  startDate?: string;
  endDate?: string;
  price?: number;
  resourceCount: number;
  seanceCount: number;
}

/** Séance avec infos du cours (prochaines séances) */
export interface SeanceWithCourseDto {
  id: number;
  title: string;
  startDateTime: string;
  durationMinutes: number;
  description?: string;
  courseId: number;
  courseTitle: string;
}

/** Résumé métier des ressources d'un cours (total + par type) */
export interface ResourcesSummaryDto {
  total: number;
  byType: Record<ResourceType, number>;
}

/** Résumé métier des séances d'un cours */
export interface SeancesSummaryDto {
  totalSeances: number;
  upcomingCount: number;
  totalDurationMinutes: number;
}

/** Statut de complétion d'un cours (métier avancé) */
export interface CourseCompletionDto {
  courseId: number;
  courseTitle: string;
  hasResources: boolean;
  hasSeances: boolean;
  complete: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class CourseApiService {

  constructor(private http: HttpClient) {}

  private coursesApi(): string {
    return `${coursesGatewayPrefix()}/api/courses`;
  }

  private metierApi(): string {
    return `${coursesGatewayPrefix()}/api/metier`;
  }

  /** Gateway (ou proxy en dev) puis repli direct 8086 — le MS courses autorise déjà CORS pour :4200. */
  private via<T>(primary: Observable<T>, direct: () => Observable<T>): Observable<T> {
    return primary.pipe(catchError(() => direct()));
  }

  getCourses(level?: CourseLevel): Observable<CourseDto[]> {
    let params = new HttpParams();
    if (level) params = params.set('level', level);
    return this.via(
      this.http.get<CourseDto[]>(this.coursesApi(), { params }),
      () => this.http.get<CourseDto[]>(COURSES_API_DIRECT, { params })
    );
  }

  getCourse(id: number): Observable<CourseDto> {
    return this.via(
      this.http.get<CourseDto>(`${this.coursesApi()}/${id}`),
      () => this.http.get<CourseDto>(`${COURSES_API_DIRECT}/${id}`)
    );
  }

  createCourse(course: CourseDto): Observable<CourseDto> {
    return this.via(
      this.http.post<CourseDto>(this.coursesApi(), course),
      () => this.http.post<CourseDto>(COURSES_API_DIRECT, course)
    );
  }

  updateCourse(id: number, course: CourseDto): Observable<CourseDto> {
    return this.via(
      this.http.put<CourseDto>(`${this.coursesApi()}/${id}`, course),
      () => this.http.put<CourseDto>(`${COURSES_API_DIRECT}/${id}`, course)
    );
  }

  deleteCourse(id: number): Observable<void> {
    return this.via(
      this.http.delete<void>(`${this.coursesApi()}/${id}`),
      () => this.http.delete<void>(`${COURSES_API_DIRECT}/${id}`)
    );
  }

  getResources(courseId: number): Observable<ResourceDto[]> {
    return this.via(
      this.http.get<ResourceDto[]>(`${this.coursesApi()}/${courseId}/resources`),
      () => this.http.get<ResourceDto[]>(`${COURSES_API_DIRECT}/${courseId}/resources`)
    );
  }

  addResource(courseId: number, resource: ResourceDto): Observable<ResourceDto> {
    return this.via(
      this.http.post<ResourceDto>(`${this.coursesApi()}/${courseId}/resources`, resource),
      () => this.http.post<ResourceDto>(`${COURSES_API_DIRECT}/${courseId}/resources`, resource)
    );
  }

  deleteResource(courseId: number, resourceId: number): Observable<void> {
    return this.via(
      this.http.delete<void>(`${this.coursesApi()}/${courseId}/resources/${resourceId}`),
      () => this.http.delete<void>(`${COURSES_API_DIRECT}/${courseId}/resources/${resourceId}`)
    );
  }

  getSeances(courseId: number): Observable<SeanceDto[]> {
    return this.via(
      this.http.get<SeanceDto[]>(`${this.coursesApi()}/${courseId}/seances`),
      () => this.http.get<SeanceDto[]>(`${COURSES_API_DIRECT}/${courseId}/seances`)
    );
  }

  addSeance(courseId: number, seance: SeanceDto): Observable<SeanceDto> {
    return this.via(
      this.http.post<SeanceDto>(`${this.coursesApi()}/${courseId}/seances`, seance),
      () => this.http.post<SeanceDto>(`${COURSES_API_DIRECT}/${courseId}/seances`, seance)
    );
  }

  updateSeance(courseId: number, seanceId: number, seance: SeanceDto): Observable<SeanceDto> {
    return this.via(
      this.http.put<SeanceDto>(`${this.coursesApi()}/${courseId}/seances/${seanceId}`, seance),
      () => this.http.put<SeanceDto>(`${COURSES_API_DIRECT}/${courseId}/seances/${seanceId}`, seance)
    );
  }

  deleteSeance(courseId: number, seanceId: number): Observable<void> {
    return this.via(
      this.http.delete<void>(`${this.coursesApi()}/${courseId}/seances/${seanceId}`),
      () => this.http.delete<void>(`${COURSES_API_DIRECT}/${courseId}/seances/${seanceId}`)
    );
  }

  // ——— API métier avancées ———

  getStatistics(): Observable<StatisticsDto> {
    return this.via(
      this.http.get<StatisticsDto>(`${this.metierApi()}/statistics`),
      () => this.http.get<StatisticsDto>(`${METIER_API_DIRECT}/statistics`)
    );
  }

  getCourseSummary(courseId: number): Observable<CourseSummaryDto> {
    return this.via(
      this.http.get<CourseSummaryDto>(`${this.metierApi()}/courses/${courseId}/summary`),
      () => this.http.get<CourseSummaryDto>(`${METIER_API_DIRECT}/courses/${courseId}/summary`)
    );
  }

  getUpcomingSeances(limit = 10): Observable<SeanceWithCourseDto[]> {
    const params = { limit: String(limit) };
    return this.via(
      this.http.get<SeanceWithCourseDto[]>(`${this.metierApi()}/seances/upcoming`, { params }),
      () => this.http.get<SeanceWithCourseDto[]>(`${METIER_API_DIRECT}/seances/upcoming`, { params })
    );
  }

  /** Cours sans ressources ou sans séances (à compléter) */
  getIncompleteCourses(): Observable<CourseSummaryDto[]> {
    return this.via(
      this.http.get<CourseSummaryDto[]>(`${this.metierApi()}/courses/incomplete`),
      () => this.http.get<CourseSummaryDto[]>(`${METIER_API_DIRECT}/courses/incomplete`)
    );
  }

  /** Résumé métier des ressources d'un cours (total + par type) */
  getResourcesSummary(courseId: number): Observable<ResourcesSummaryDto> {
    return this.via(
      this.http.get<ResourcesSummaryDto>(`${this.metierApi()}/courses/${courseId}/resources/summary`),
      () =>
        this.http.get<ResourcesSummaryDto>(`${METIER_API_DIRECT}/courses/${courseId}/resources/summary`)
    );
  }

  /** Résumé métier des séances d'un cours */
  getSeancesSummary(courseId: number): Observable<SeancesSummaryDto> {
    return this.via(
      this.http.get<SeancesSummaryDto>(`${this.metierApi()}/courses/${courseId}/seances/summary`),
      () => this.http.get<SeancesSummaryDto>(`${METIER_API_DIRECT}/courses/${courseId}/seances/summary`)
    );
  }

  /** Prochaine séance à venir pour un cours (métier avancé). 404 si aucune. */
  getNextSeanceForCourse(courseId: number): Observable<SeanceWithCourseDto | null> {
    const primary = this.http.get<SeanceWithCourseDto>(
      `${this.metierApi()}/courses/${courseId}/next-seance`
    );
    if (isNgServe()) {
      return primary.pipe(catchError(() => of(null)));
    }
    return primary.pipe(
      catchError(() =>
        this.http
          .get<SeanceWithCourseDto>(`${METIER_API_DIRECT}/courses/${courseId}/next-seance`)
          .pipe(catchError(() => of(null)))
      )
    );
  }

  /** Statut de complétion du cours : complet = au moins 1 ressource et 1 séance (métier avancé). */
  getCourseCompletionStatus(courseId: number): Observable<CourseCompletionDto> {
    return this.via(
      this.http.get<CourseCompletionDto>(`${this.metierApi()}/courses/${courseId}/completion-status`),
      () =>
        this.http.get<CourseCompletionDto>(`${METIER_API_DIRECT}/courses/${courseId}/completion-status`)
    );
  }

  /** Réponse paginée (Spring Page). */
  getCoursesPaginated(page: number, size: number, level?: CourseLevel): Observable<PageResponse<CourseDto>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (level) params = params.set('level', level);
    return this.via(
      this.http.get<PageResponse<CourseDto>>(`${this.coursesApi()}/paged`, { params }),
      () => this.http.get<PageResponse<CourseDto>>(`${COURSES_API_DIRECT}/paged`, { params })
    );
  }
}

/** Structure renvoyée par Spring Data Page (champs principaux). */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}
