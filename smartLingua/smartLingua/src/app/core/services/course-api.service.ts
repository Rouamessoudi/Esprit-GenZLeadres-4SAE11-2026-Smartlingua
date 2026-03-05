import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

const GATEWAY_BASE = 'http://localhost:8093/courses';
const DIRECT_BASE = 'http://localhost:8086';
const COURSES_API = `${GATEWAY_BASE}/api/courses`;
const COURSES_API_DIRECT = `${DIRECT_BASE}/api/courses`;
const METIER_API = `${GATEWAY_BASE}/api/metier`;
const METIER_API_DIRECT = `${DIRECT_BASE}/api/metier`;

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

  getCourses(level?: CourseLevel): Observable<CourseDto[]> {
    let params = new HttpParams();
    if (level) params = params.set('level', level);
    return this.http.get<CourseDto[]>(COURSES_API, { params }).pipe(
      catchError(() => this.http.get<CourseDto[]>(COURSES_API_DIRECT, { params }))
    );
  }

  getCourse(id: number): Observable<CourseDto> {
    return this.http.get<CourseDto>(`${COURSES_API}/${id}`).pipe(
      catchError(() => this.http.get<CourseDto>(`${COURSES_API_DIRECT}/${id}`))
    );
  }

  createCourse(course: CourseDto): Observable<CourseDto> {
    return this.http.post<CourseDto>(COURSES_API, course).pipe(
      catchError(() => this.http.post<CourseDto>(COURSES_API_DIRECT, course))
    );
  }

  updateCourse(id: number, course: CourseDto): Observable<CourseDto> {
    return this.http.put<CourseDto>(`${COURSES_API}/${id}`, course).pipe(
      catchError(() => this.http.put<CourseDto>(`${COURSES_API_DIRECT}/${id}`, course))
    );
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<void>(`${COURSES_API}/${id}`).pipe(
      catchError(() => this.http.delete<void>(`${COURSES_API_DIRECT}/${id}`))
    );
  }

  getResources(courseId: number): Observable<ResourceDto[]> {
    return this.http.get<ResourceDto[]>(`${COURSES_API}/${courseId}/resources`).pipe(
      catchError(() => this.http.get<ResourceDto[]>(`${COURSES_API_DIRECT}/${courseId}/resources`))
    );
  }

  addResource(courseId: number, resource: ResourceDto): Observable<ResourceDto> {
    return this.http.post<ResourceDto>(`${COURSES_API}/${courseId}/resources`, resource).pipe(
      catchError(() => this.http.post<ResourceDto>(`${COURSES_API_DIRECT}/${courseId}/resources`, resource))
    );
  }

  deleteResource(courseId: number, resourceId: number): Observable<void> {
    return this.http.delete<void>(`${COURSES_API}/${courseId}/resources/${resourceId}`).pipe(
      catchError(() => this.http.delete<void>(`${COURSES_API_DIRECT}/${courseId}/resources/${resourceId}`))
    );
  }

  getSeances(courseId: number): Observable<SeanceDto[]> {
    return this.http.get<SeanceDto[]>(`${COURSES_API}/${courseId}/seances`).pipe(
      catchError(() => this.http.get<SeanceDto[]>(`${COURSES_API_DIRECT}/${courseId}/seances`))
    );
  }

  addSeance(courseId: number, seance: SeanceDto): Observable<SeanceDto> {
    return this.http.post<SeanceDto>(`${COURSES_API}/${courseId}/seances`, seance).pipe(
      catchError(() => this.http.post<SeanceDto>(`${COURSES_API_DIRECT}/${courseId}/seances`, seance))
    );
  }

  updateSeance(courseId: number, seanceId: number, seance: SeanceDto): Observable<SeanceDto> {
    return this.http.put<SeanceDto>(`${COURSES_API}/${courseId}/seances/${seanceId}`, seance).pipe(
      catchError(() => this.http.put<SeanceDto>(`${COURSES_API_DIRECT}/${courseId}/seances/${seanceId}`, seance))
    );
  }

  deleteSeance(courseId: number, seanceId: number): Observable<void> {
    return this.http.delete<void>(`${COURSES_API}/${courseId}/seances/${seanceId}`).pipe(
      catchError(() => this.http.delete<void>(`${COURSES_API_DIRECT}/${courseId}/seances/${seanceId}`))
    );
  }

  // ——— API métier avancées ———

  getStatistics(): Observable<StatisticsDto> {
    return this.http.get<StatisticsDto>(`${METIER_API}/statistics`).pipe(
      catchError(() => this.http.get<StatisticsDto>(`${METIER_API_DIRECT}/statistics`))
    );
  }

  getCourseSummary(courseId: number): Observable<CourseSummaryDto> {
    return this.http.get<CourseSummaryDto>(`${METIER_API}/courses/${courseId}/summary`).pipe(
      catchError(() => this.http.get<CourseSummaryDto>(`${METIER_API_DIRECT}/courses/${courseId}/summary`))
    );
  }

  getUpcomingSeances(limit = 10): Observable<SeanceWithCourseDto[]> {
    const params = { limit: String(limit) };
    return this.http.get<SeanceWithCourseDto[]>(`${METIER_API}/seances/upcoming`, { params }).pipe(
      catchError(() => this.http.get<SeanceWithCourseDto[]>(`${METIER_API_DIRECT}/seances/upcoming`, { params }))
    );
  }

  /** Cours sans ressources ou sans séances (à compléter) */
  getIncompleteCourses(): Observable<CourseSummaryDto[]> {
    return this.http.get<CourseSummaryDto[]>(`${METIER_API}/courses/incomplete`).pipe(
      catchError(() => this.http.get<CourseSummaryDto[]>(`${METIER_API_DIRECT}/courses/incomplete`))
    );
  }

  /** Résumé métier des ressources d'un cours (total + par type) */
  getResourcesSummary(courseId: number): Observable<ResourcesSummaryDto> {
    return this.http.get<ResourcesSummaryDto>(`${METIER_API}/courses/${courseId}/resources/summary`).pipe(
      catchError(() => this.http.get<ResourcesSummaryDto>(`${METIER_API_DIRECT}/courses/${courseId}/resources/summary`))
    );
  }

  /** Résumé métier des séances d'un cours */
  getSeancesSummary(courseId: number): Observable<SeancesSummaryDto> {
    return this.http.get<SeancesSummaryDto>(`${METIER_API}/courses/${courseId}/seances/summary`).pipe(
      catchError(() => this.http.get<SeancesSummaryDto>(`${METIER_API_DIRECT}/courses/${courseId}/seances/summary`))
    );
  }

  /** Prochaine séance à venir pour un cours (métier avancé). 404 si aucune. */
  getNextSeanceForCourse(courseId: number): Observable<SeanceWithCourseDto | null> {
    return this.http.get<SeanceWithCourseDto>(`${METIER_API}/courses/${courseId}/next-seance`).pipe(
      catchError(() => this.http.get<SeanceWithCourseDto>(`${METIER_API_DIRECT}/courses/${courseId}/next-seance`).pipe(
        catchError(() => of(null))
      ))
    );
  }

  /** Statut de complétion du cours : complet = au moins 1 ressource et 1 séance (métier avancé). */
  getCourseCompletionStatus(courseId: number): Observable<CourseCompletionDto> {
    return this.http.get<CourseCompletionDto>(`${METIER_API}/courses/${courseId}/completion-status`).pipe(
      catchError(() => this.http.get<CourseCompletionDto>(`${METIER_API_DIRECT}/courses/${courseId}/completion-status`))
    );
  }

  /** Réponse paginée (Spring Page). */
  getCoursesPaginated(page: number, size: number, level?: CourseLevel): Observable<PageResponse<CourseDto>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (level) params = params.set('level', level);
    return this.http.get<PageResponse<CourseDto>>(`${COURSES_API}/paged`, { params }).pipe(
      catchError(() => this.http.get<PageResponse<CourseDto>>(`${COURSES_API_DIRECT}/paged`, { params }))
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
