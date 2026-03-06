import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [RouterLink],
    template: `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <a routerLink="/" class="logo">
              <span class="material-icons-round logo-icon">translate</span>
              <span class="logo-text">Smart<span class="logo-accent">Lingua</span></span>
            </a>
            <p>Master English with interactive courses, quizzes, and personalized learning paths designed by language experts.</p>
            <div class="social-links">
              <a href="#" aria-label="Twitter"><span class="material-icons-round">tag</span></a>
              <a href="#" aria-label="YouTube"><span class="material-icons-round">play_circle</span></a>
              <a href="#" aria-label="LinkedIn"><span class="material-icons-round">work</span></a>
            </div>
          </div>
          <div class="footer-col">
            <h4>Platform</h4>
            <ul>
              <li><a routerLink="/courses">Courses</a></li>
              <li><a href="#">Quizzes</a></li>
              <li><a href="#">Resources</a></li>
              <li><a href="#">Pricing</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="#">About Us</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Support</h4>
            <ul>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">FAQ</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2026 SmartLingua. All rights reserved.</p>
          <p>Made with <span class="heart">♥</span> for language learners</p>
        </div>
      </div>
    </footer>
  `,
    styleUrl: './footer.component.scss'
})
export class FooterComponent { }
