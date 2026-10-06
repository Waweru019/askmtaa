import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServiceApi, VendorProfile, Listing, SubService, Category } from '../../service/service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html'
})
export class Dashboard implements OnInit {
  private api = inject(ServiceApi);

  // ===================== TAB STATE =====================
  activeTab = signal<'post' | 'inventory' | 'profile'>('post');

  // ===================== VENDOR DATA =====================
  vendorProfile = signal<VendorProfile | null>(null);
  listings = signal<Listing[]>([]);
  categories = signal<Category[]>([]);

  // ===================== POST FORM SIGNALS =====================
  listingType = signal<'product' | 'property' | 'service' | 'trip'>('product');
  title = signal<string>('');
  caption = signal<string>('');
  mobileSidebarOpen = signal(false);
  price = signal<number | null>(null);
  imageUrl = signal<string>('');
  previewUrl = signal<string>('');
  isUploadingImage = signal<boolean>(false); // Tracks Cloudinary upload state
  propertyLocationOverride = signal<string>('');
  isSubmitting = signal<boolean>(false);

  // Trip / Event / Data Mwitu specific
  eventDate = signal<string>('');
  duration = signal<string>('Day Trip');
  meetingPoint = signal<string>('');
  includedItems = signal<string>('');
  excludedItems = signal<string>('');
  maxSlots = signal<number | null>(null);

  // Service sub-options
  subServices = signal<SubService[]>([{ name: '', price: 0 }]);

  // Edit mode
  editingListingId = signal<string | null>(null);

  // ===================== PROFILE FORM =====================
  profileForm = signal({
    businessName: '',
    phoneNumber: '',
    whatsAppNumber: '',
    defaultLocation: ''
  });

  // ===================== LIFECYCLE =====================
  ngOnInit(): void {
    this.loadVendorProfile();
    this.loadListings();
    this.loadCategories();
  }

  // ===================== DATA LOADING =====================
  loadVendorProfile(): void {
    this.api.getVendorDashboard().subscribe({
      next: (data: any) => {
        const vendor = data?.vendor ?? data;

        if (!vendor) {
          console.warn('No vendor data found in response');
          return;
        }

        this.vendorProfile.set(vendor);

        const phone = vendor.phoneNumber || vendor.whatsAppNumber || '';

        this.profileForm.set({
          businessName: vendor.businessName || '',
          phoneNumber: phone,
          whatsAppNumber: vendor.whatsAppNumber || phone,
          defaultLocation: vendor.defaultLocation || ''
        });
      },
      error: (err) => {
        console.error('Failed to load vendor profile:', err);
      }
    });
  }

  loadListings(): void {
    this.api.getListings().subscribe({
      next: (data: Listing[]) => this.listings.set(data),
      error: (err) => console.error('Failed to load listings:', err)
    });
  }

  loadCategories(): void {
    this.api.getCategories().subscribe({
      next: (data: Category[]) => this.categories.set(data),
      error: (err) => console.error('Failed to load categories:', err)
    });
  }

  // ===================== LISTING TYPE =====================
  setListingType(type: 'product' | 'property' | 'service' | 'trip'): void {
    this.listingType.set(type);
    if (type === 'service' && this.subServices().length === 0) {
      this.subServices.set([{ name: '', price: 0 }]);
    }
  }

  // ===================== SUB-SERVICES =====================
  addSubService(): void {
    this.subServices.update(items => [...items, { name: '', price: 0 }]);
  }

  removeSubService(index: number): void {
    this.subServices.update(items => items.filter((_, i) => i !== index));
  }

 onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];

  // 1. Show instant local preview
  const objectUrl = URL.createObjectURL(file);
  this.previewUrl.set(objectUrl);
  this.isUploadingImage.set(true);

  this.api.uploadImage(file).subscribe({
  next: (res: any) => {
    // Log the FULL response object to inspect all keys
    console.log('📦 FULL UPLOAD RESPONSE:', res);

    // Support multiple common backend response formats
    const uploadedUrl = res?.imageUrl || res?.image_url || res?.url || res?.secure_url || res?.data?.imageUrl;

    if (uploadedUrl) {
      this.imageUrl.set(uploadedUrl);
      console.log('✅ Image URL set to:', uploadedUrl);
    } else {
      console.error('⚠️ Could not find image URL in response keys:', res);
      alert('Upload succeeded, but no valid image URL key was found in response.');
    }

    this.isUploadingImage.set(false);
  },
  error: (err) => {
    this.isUploadingImage.set(false);
    this.previewUrl.set('');
    console.error('❌ Upload Failed:', err);
  }
});
    
}

removePhoto(): void {
  this.imageUrl.set('');
  this.previewUrl.set('');
  this.isUploadingImage.set(false);
}

  // ===================== EDIT LISTING =====================
  editListing(item: Listing): void {
    this.editingListingId.set(item.id);
    this.title.set(item.title || '');
    this.caption.set(item.description || item.title || '');
    this.price.set(item.price);
    this.imageUrl.set(item.imageUrl || '');
    this.propertyLocationOverride.set(item.location || '');
    this.listingType.set(item.listingType as any);

    // Trip fields
    if (item.startDate) {
      const formattedDate = new Date(item.startDate).toISOString().split('T')[0];
      this.eventDate.set(formattedDate);
    }
    if (item.meetingPoint) this.meetingPoint.set(item.meetingPoint);
    if (item.instructions) this.includedItems.set(item.instructions);

    // Sub-services
    if (item.subServices && item.subServices.length > 0) {
      this.subServices.set(item.subServices.map(s => ({ name: s.name, price: s.price })));
    } else {
      this.subServices.set([{ name: '', price: 0 }]);
    }

    this.activeTab.set('post');
  }

  // ===================== SUBMIT (CREATE / UPDATE) =====================
  submitListing(): void {
    if (this.isUploadingImage()) {
      alert('Please wait for the image upload to complete before submitting.');
      return;
    }

    const text = this.caption().trim();
    if (!text) {
      alert('Please enter a short description or caption');
      return;
    }

    const currentType = this.listingType();
    const profile = this.vendorProfile();
    const validSubServices = this.subServices().filter(s => s.name.trim() !== '');

    // Effective price
    let finalPrice = this.price() ?? 0;
    if (currentType === 'service' && validSubServices.length > 0) {
      finalPrice = Math.min(...validSubServices.map(s => Number(s.price) || 0));
    }

    // Title
    const derivedTitle = this.title().trim() || 
      (text.length > 35 ? text.substring(0, 35) + '...' : text);

    // Location
    const finalLocation =
      (currentType === 'property' && this.propertyLocationOverride().trim())
        ? this.propertyLocationOverride().trim()
        : (profile?.defaultLocation || '');

    // Category
    const matchedCategory = this.categories().find(
      c => c.slug === currentType || c.type === currentType
    );

    const payload: any = {
      title: derivedTitle,
      description: text,
      listingType: currentType,
      categoryId: matchedCategory?.id,
      price: finalPrice,
      priceType: currentType === 'service' ? 'starting_from' : 'fixed',
      imageUrl: this.imageUrl(),
      
      location: finalLocation
    };

    // Type-specific fields
    if (currentType === 'service') {
      payload.subServices = validSubServices;
    } else if (currentType === 'property') {
      payload.propertyDetails = {
        bedrooms: 1,
        bathrooms: 1,
        rentPeriod: 'monthly'
      };
    } else if (currentType === 'product') {
      payload.inventoryDetails = {
        stockQuantity: 1,
        condition: 'new'
      };
    } else if (currentType === 'trip') {
      payload.startDate = this.eventDate() || undefined;
      payload.meetingPoint = this.meetingPoint() || undefined;
      payload.instructions = this.includedItems() || undefined;
      payload.duration = this.duration() || undefined;
      payload.maxSlots = this.maxSlots() || undefined;
      payload.excludedItems = this.excludedItems() || undefined;
    }

    this.isSubmitting.set(true);

    const editId = this.editingListingId();

    if (editId) {
      // UPDATE
      this.api.updateListing(editId, payload).subscribe({
        next: (updated: Listing) => {
          this.isSubmitting.set(false);
          this.listings.update(items =>
            items.map(item => (item.id === editId ? updated : item))
          );
          this.resetPostForm();
          this.activeTab.set('inventory');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          alert(err.error?.error || 'Failed to update item.');
        }
      });
    } else {
      // CREATE
      this.api.createListing(payload).subscribe({
        next: (created: Listing) => {
          this.isSubmitting.set(false);
          this.listings.update(items => [created, ...items]);
          this.resetPostForm();
          this.activeTab.set('inventory');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error('Submission error:', err);
          alert(err.error?.error || 'Failed to post item. Check details and try again.');
        }
      });
    }
  }
  

  // ===================== RESET FORM =====================
  resetPostForm(): void {
    this.editingListingId.set(null);
    this.title.set('');
    this.caption.set('');
    this.price.set(null);
    this.imageUrl.set('');
    this.isUploadingImage.set(false);
    this.propertyLocationOverride.set('');
    this.eventDate.set('');
    this.duration.set('Day Trip');
    this.meetingPoint.set('');
    this.includedItems.set('');
    this.excludedItems.set('');
    this.maxSlots.set(null);
    this.subServices.set([{ name: '', price: 0 }]);
  }

  // ===================== DELETE LISTING =====================
  deleteListing(id: string): void {
    this.api.deleteListing(id).subscribe({
      next: () => {
        this.listings.update(items => items.filter(item => item.id !== id));
      },
      error: (err) => {
        console.error('Failed to delete listing', err);
        alert('Failed to delete listing. Please try again.');
      }
    });
  }

  // ===================== UPDATE STATUS (QUICK TOGGLE) =====================
  updateStatus(id: string, newStatus: string): void {
    this.api.updateListingStatus(id, newStatus).subscribe({
      next: () => {
        this.listings.update(items =>
          items.map(item =>
            item.id === id ? { ...item, status: newStatus } : item
          )
        );
      },
      error: (err) => {
        console.error('Failed to update listing status:', err);
        alert('Failed to update status. Please try again.');
      }
    });
  }

  // ===================== SAVE PROFILE =====================
  saveProfile(): void {
    const form = this.profileForm();

    const payload = {
      businessName: form.businessName,
      phoneNumber: form.phoneNumber || form.whatsAppNumber,
      whatsAppNumber: form.whatsAppNumber || form.phoneNumber,
      defaultLocation: form.defaultLocation
    };

    this.api.updateSettings(payload).subscribe({
      next: () => {
        alert('Shop profile updated!');
        this.loadVendorProfile();
      },
      error: () => alert('Failed to update profile. Please try again.')
    });
  }

  // ===================== LOGOUT =====================
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    window.location.href = '/login';
  }
}