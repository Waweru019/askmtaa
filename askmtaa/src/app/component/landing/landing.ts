import { 
  AfterViewInit, 
  Component, 
  ElementRef, 
  OnDestroy, 
  OnInit, 
  PLATFORM_ID, 
  inject, 
  signal 
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements OnInit, AfterViewInit, OnDestroy {
  // SSR Platform Check Injection
  private platformId = inject(PLATFORM_ID);

  // Services
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private el = inject(ElementRef);

  // Navigation & UI State
  mobileMenuOpen = signal<boolean>(false);
  private observer?: IntersectionObserver;

  toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
  }

  ngOnInit(): void {
    // Dynamic SEO Metadata (Runs on both SSR and Client)
    this.titleService.setTitle('Askmtaa - Find Local Answers');

    this.metaService.updateTag({
      name: 'description',
      content: 'Explore local neighborhood services, ask questions, and engage with your community.'
    });

    this.metaService.updateTag({
      property: 'og:title',
      content: 'Askmtaa - Find Local Answers'
    });
  }

  ngAfterViewInit(): void {
    // Only execute DOM animations on the client browser
    if (isPlatformBrowser(this.platformId)) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              this.observer?.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.12,
          rootMargin: '0px 0px -40px 0px'
        }
      );

      const sections = this.el.nativeElement.querySelectorAll('.reveal');
      sections.forEach((section: Element) => this.observer?.observe(section));
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.observer?.disconnect();
    }
  }
}