import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

export interface AdminStats {
  totalListings: number;
  activeListings: number;
  pausedListings: number;
}

export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  phoneNumber: string;
  whatsAppNumber: string;
  defaultLocation: string;
  verified: boolean;
  createdAt: string;
}

export interface DashboardResponse {
  stats: AdminStats;
  vendor: VendorProfile;
}

export interface AdminVendor {
  id: string;
  whatsAppNumber: string;
  businessName: string;
  phoneNumber: string;
  defaultLocation: string;
  isVerified: boolean;
  status: 'active' | 'suspended';
  listingsCount?: number;
  createdAt: string;
}

export interface AdminListing {
  id: string;
  title: string;
  price: number;
  listingType: string;
  status: 'active' | 'paused' | 'flagged';
  businessName: string;
  categoryName: string;
  createdAt: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  type: 'item' | 'service' | 'trip';
  listingsCount?: number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  private vendorApiUrl = 'http://localhost:8080/api/vendor';
  private adminApiUrl = 'http://localhost:8080/api/admin';

  // State Signals
  activeTab = signal<'overview' | 'vendors' | 'listings' | 'categories'>('overview');
  isLoading = signal<boolean>(false);

  // Data Signals
  stats = signal<AdminStats>({
    totalListings: 0,
    activeListings: 0,
    pausedListings: 0,
  });

  vendor = signal<VendorProfile | null>(null);
  vendors = signal<AdminVendor[]>([]);
  listings = signal<AdminListing[]>([]);
  categories = signal<AdminCategory[]>([]);
  mobileNavOpen = signal(false);

  // Search & Forms
  vendorSearch = signal<string>('');
  newCategoryName = signal<string>('');
  newCategoryType = signal<'item' | 'service' | 'trip'>('item');
  // Edit Category Signals
editingCategoryId = signal<string | null>(null);
editCategoryName = signal<string>('');
editCategoryType = signal<'item' | 'service' | 'trip'>('item');



  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    this.fetchDashboardData();
    this.fetchListings();
    this.fetchVendors();
    this.fetchCategories();
  }

  // --- API FETCHERS ---
  fetchDashboardData(): void {
    this.http.get<DashboardResponse>(`${this.vendorApiUrl}/dashboard`).subscribe({
      next: (res) => {
        this.stats.set(res.stats);
        this.vendor.set(res.vendor);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load vendor dashboard:', err);
        this.isLoading.set(false);
      },
    });
  }

  fetchListings(): void {
    this.http.get<AdminListing[]>(`${this.vendorApiUrl}/listings`).subscribe({
      next: (res) => this.listings.set(res),
      error: (err) => console.error('Failed to load listings:', err),
    });
  }

  fetchVendors(): void {
    this.http.get<AdminVendor[]>(`${this.vendorApiUrl}/vendor`).subscribe({
      next: (res) => this.vendors.set(res),
      error: () => {
        // Fallback if platform vendor management route isn't active yet
        this.vendors.set([]);
      },
    });
  }

  fetchCategories(): void {
    this.http.get<AdminCategory[]>(`${this.vendorApiUrl}/categories`).subscribe({
      next: (res) => this.categories.set(res),
      error: () => this.categories.set([]),
    });
  }

  // --- VENDOR ACTIONS ---
  toggleVendorVerification(vendorId: string, currentStatus: boolean): void {
    this.http
      .patch(`${this.adminApiUrl}/vendors/${vendorId}/verify`, { isVerified: !currentStatus })
      .subscribe({
        next: () => {
          this.vendors.update((items) =>
            items.map((v) => (v.id === vendorId ? { ...v, isVerified: !currentStatus } : v))
          );
        },
      });
  }

  toggleVendorStatus(vendorId: string, currentStatus: string): void {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    this.http
      .patch(`${this.adminApiUrl}/vendors/${vendorId}/status`, { status: newStatus })
      .subscribe({
        next: () => {
          this.vendors.update((items) =>
            items.map((v) => (v.id === vendorId ? { ...v, status: newStatus as any } : v))
          );
        },
      });
  }

  // --- LISTING ACTIONS ---
  updateListingStatus(listingId: string, status: string): void {
    this.http
      .patch(`${this.vendorApiUrl}/listings/${listingId}/status`, { status })
      .subscribe({
        next: () => {
          this.listings.update((items) =>
            items.map((l) => (l.id === listingId ? { ...l, status: status as any } : l))
          );
        },
      });
  }

  deleteListing(listingId: string): void {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    this.http.delete(`${this.vendorApiUrl}/listings/${listingId}`).subscribe({
      next: () => {
        this.listings.update((items) => items.filter((l) => l.id !== listingId));
      },
    });
  }

  // --- CATEGORY ACTIONS ---
  addCategory(): void {
    const name = this.newCategoryName().trim();
    if (!name) return;

    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const payload = { name, slug, type: this.newCategoryType() };

    this.http.post<AdminCategory>(`${this.vendorApiUrl}/categories`, payload).subscribe({
      next: (created) => {
        this.categories.update((items) => [...items, created]);
        this.newCategoryName.set('');
      },
      error: (err) => alert(err.error?.error || 'Failed to create category'),
    });
  }

  deleteCategory(catId: string): void {
    if (!confirm('Delete category?')) return;
    this.http.delete(`${this.vendorApiUrl}/categories/${catId}`).subscribe({
      next: () => {
        this.categories.update((items) => items.filter((c) => c.id !== catId));
      },
    });
  }
// Start Editing Category
startEditCategory(cat: AdminCategory): void {
  this.editingCategoryId.set(cat.id);
  this.editCategoryName.set(cat.name);
  this.editCategoryType.set(cat.type);
}

// Cancel Editing
cancelEditCategory(): void {
  this.editingCategoryId.set(null);
  this.editCategoryName.set('');
  this.editCategoryType.set('item');
}

// Save Updated Category
saveCategory(catId: string): void {
  const name = this.editCategoryName().trim();
  if (!name) return;

  const payload = {
    name,
    type: this.editCategoryType()
  };

  this.http.put<AdminCategory>(`${this.vendorApiUrl}/categories/${catId}`, payload).subscribe({
    next: (updated) => {
      this.categories.update((items) =>
        items.map((c) => (c.id === catId ? updated : c))
      );
      this.cancelEditCategory();
    },
    error: (err) => alert(err.error?.error || 'Failed to update category')
  });
}


  // Filtered Vendors Computed Signal
  filteredVendors = computed(() => {
    const q = this.vendorSearch().toLowerCase().trim();
    return this.vendors().filter(
      (v) =>
        v.businessName.toLowerCase().includes(q) ||
        v.phoneNumber.includes(q) ||
        v.defaultLocation.toLowerCase().includes(q)
    );
  });
}