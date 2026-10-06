import { AfterViewInit, Component,signal ,ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink], // Added RouterLink here
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  // Navigation & UI State
  mobileMenuOpen = signal<boolean>(false);
  toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
  }

private observer?: IntersectionObserver;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Optional: stop observing once revealed
            this.observer?.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    // Observe all sections with .reveal
    const sections = this.el.nativeElement.querySelectorAll('.reveal');
    sections.forEach((section: Element) => this.observer?.observe(section));
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  
}
}
  // ... rest of your existing code (mobileMenuOpen, toggleMobileMenu, etc.)