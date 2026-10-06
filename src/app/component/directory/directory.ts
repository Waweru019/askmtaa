import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

export interface PublicVendor {
  id: string;
  businessName: string;
  phoneNumber: string;
}

export interface CategoryObject {
  id: string;
  name: string;
  slug: string;
  type: string;
}

export interface PublicListing {
  id: string;
  title: string;
  description: string;
  listingType: string;
  price: number;
  priceType: string;
  imageUrl?: string;
  location: string;
  status: string; // 'active' | 'paused' | 'sold'
  categoryId: string;
  category?: CategoryObject;
  startDate?: string;
  meetingPoint?: string;
  instructions?: string;
  vendor?: PublicVendor;
  createdAt: string;
}

export interface GroupedCategory {
  categoryId: string;
  categoryName: string;
  listings: PublicListing[];
}

@Component({
  selector: 'app-directory',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe],
  templateUrl: './directory.html',
  styleUrl: './directory.css',
})
export class Directory implements OnInit {
  private apiUrl = 'http://localhost:8080/api/';

  // Signals
  rawListings = signal<PublicListing[]>([]);
  searchQuery = signal<string>('');
  selectedCategoryFilter = signal<string>('all'); // 'all' or category UUID
  isLoading = signal<boolean>(true);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchPublicListings();
  }

  fetchPublicListings(): void {
    this.isLoading.set(true);
    this.http.get<PublicListing[]>(`${this.apiUrl}listings`).subscribe({
      next: (data) => {
        // FILTER: Keep ONLY listings where status === 'active'
        const activeListings = (data || []).filter(item => item.status === 'active');
        this.rawListings.set(activeListings);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching public directory listings:', err);
        this.isLoading.set(false);
      }
    });
  }

  // Extract unique active categories dynamically from listings
  availableCategories = computed(() => {
    const activeListings = this.rawListings();
    const categoriesMap = new Map<string, { id: string; name: string; count: number }>();

    activeListings.forEach(item => {
      if (item.category) {
        const catId = item.category.id;
        if (!categoriesMap.has(catId)) {
          categoriesMap.set(catId, {
            id: catId,
            name: item.category.name,
            count: 1
          });
        } else {
          categoriesMap.get(catId)!.count++;
        }
      }
    });

    return Array.from(categoriesMap.values());
  });

  // Filter listings based on search query and category pill selection
  filteredListings = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const catFilter = this.selectedCategoryFilter();

    return this.rawListings().filter(item => {
      const matchesSearch = 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        (item.vendor?.businessName && item.vendor.businessName.toLowerCase().includes(query));

      const matchesCat = catFilter === 'all' || item.categoryId === catFilter || item.category?.id === catFilter;

      return matchesSearch && matchesCat;
    });
  });

  // Group active filtered listings by Category
  groupedCategories = computed(() => {
    const listings = this.filteredListings();
    const groupsMap = new Map<string, GroupedCategory>();

    listings.forEach(item => {
      const catName = item.category?.name || 'General Listings';
      const catId = item.categoryId || catName;

      if (!groupsMap.has(catId)) {
        groupsMap.set(catId, {
          categoryId: catId,
          categoryName: catName,
          listings: []
        });
      }
      groupsMap.get(catId)!.listings.push(item);
    });

    return Array.from(groupsMap.values());
  });

  // Generate WhatsApp Direct Chat Link
  getWhatsAppUrl(item: PublicListing): string {
    const rawPhone = item.vendor?.phoneNumber || '';
    let cleanPhone = rawPhone.replace(/\D/g, '');
    
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '254' + cleanPhone.substring(1);
    }

    const message = `Hi ${item.vendor?.businessName || 'Vendor'}, I am interested in your listing "${item.title}" priced at KSh ${item.price} on AskMtaa. Is it still available?`;
    
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }
}