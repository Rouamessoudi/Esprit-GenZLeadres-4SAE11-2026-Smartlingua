import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-role-dashboard-redirect',
  standalone: true,
  template: ''
})
export class RoleDashboardRedirectComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    void this.router.navigateByUrl(this.authService.getDefaultDashboardPath(), { replaceUrl: true });
  }
}
