import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// -----------------------------------------------------------------------------
// Interfaces
// -----------------------------------------------------------------------------

export interface SubService {
  id?: string;
  listingId?: string;
  name: string;
  price: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  type?: string;
}

export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  phoneNumber: string;
  whatsAppNumber?: string;
  defaultLocation?: string;
  verified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Listing {
  id: string;
  vendorId: string;
  categoryId: string;
  category?: Category;
  title: string;
  description: string;
  listingType: 'product' | 'property' | 'service' | 'trip' | 'digital' | string;
  status: string;
  price: number;
  priceType?: string;
  imageUrl?: string;
  location: string;
  exactAddress?: string;
  latitude?: number;
  longitude?: number;
  startDate?: string;
  endDate?: string;
  meetingPoint?: string;
  networkProvider?: string;
  instructions?: string;
  subServices?: SubService[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateListingPayload {
  title: string;
  description: string;
  listingType: string;
  categoryId?: string;
  price?: number;
  priceType?: string;
  imageUrl?: string;
  location?: string;
  subServices?: SubService[];
  startDate?: string;
  meetingPoint?: string;
  instructions?: string;
  duration?: string;
  maxSlots?: number;
  excludedItems?: string;
  propertyDetails?: any;
  inventoryDetails?: any;
}

export interface UpdateSettingsPayload {
  businessName: string;
  phoneNumber?: string;
  whatsAppNumber?: string;
  defaultLocation?: string;
}

export interface RegisterPayload {
  phoneNumber: string;
  email: string;
  password: string;
  role?: string;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    phoneNumber: string;
    role: string;
    vendor?: VendorProfile;
  };
}

// -----------------------------------------------------------------------------
// Service
// -----------------------------------------------------------------------------

@Injectable({
  providedIn: 'root'
})
export class ServiceApi {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private apiUrl = 'http://localhost:8080/api';

  // Safely initialize signal based on browser execution environment
  tokenSignal = signal<string | null>(
    isPlatformBrowser(this.platformId) ? localStorage.getItem('token') : null
  );

  // ---------- Token & Storage helpers ----------
  saveToken(token: string): void {
    if (token && isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', token);
      this.tokenSignal.set(token);
    }
  }

  saveUser(user: any): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  getUser(): any {
    if (isPlatformBrowser(this.platformId)) {
      const userData = localStorage.getItem('user');
      return userData ? JSON.parse(userData) : null;
    }
    return null;
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    this.tokenSignal.set(null);
  }

  // ---------- Force Authorization header ----------
  private authHeaders(): { headers: HttpHeaders } {
    const token = this.getToken();
    return {
      headers: new HttpHeaders({
        Authorization: token ? `Bearer ${token}` : ''
      })
    };
  }

  // ---------- Auth ----------
  register(payload: RegisterPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, payload);
  }

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, payload);
  }

  // ---------- Public ----------
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/vendor/categories`);
  }

  // ---------- Protected Vendor routes ----------
  getVendorDashboard(): Observable<VendorProfile> {
    return this.http.get<VendorProfile>(
      `${this.apiUrl}/vendor/dashboard`,
      this.authHeaders()
    );
  }

  getListings(): Observable<Listing[]> {
    return this.http.get<Listing[]>(
      `${this.apiUrl}/vendor/listings`,
      this.authHeaders()
    );
  }

  createListing(payload: CreateListingPayload): Observable<Listing> {
    return this.http.post<Listing>(
      `${this.apiUrl}/vendor/listings`,
      payload,
      this.authHeaders()
    );
  }

  updateListing(id: string, payload: CreateListingPayload): Observable<Listing> {
    return this.http.put<Listing>(
      `${this.apiUrl}/vendor/listings/${id}`,
      payload,
      this.authHeaders()
    );
  }

  updateListingStatus(id: string, status: string): Observable<any> {
    return this.http.patch(
      `${this.apiUrl}/vendor/listings/${id}/status`,
      { status },
      this.authHeaders()
    );
  }

  deleteListing(id: string): Observable<any> {
    return this.http.delete(
      `${this.apiUrl}/vendor/listings/${id}`,
      this.authHeaders()
    );
  }

  updateSettings(payload: UpdateSettingsPayload): Observable<VendorProfile> {
    return this.http.put<VendorProfile>(
      `${this.apiUrl}/vendor/settings`,
      payload,
      this.authHeaders()
    );
  }

  uploadImage(file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = this.getToken(); // Replaced direct localStorage access with SSR-safe helper
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : ''
    });

    return this.http.post<{ imageUrl: string }>(
      `${this.apiUrl}/vendor/upload`,
      formData,
      { headers }
    );
  }
}