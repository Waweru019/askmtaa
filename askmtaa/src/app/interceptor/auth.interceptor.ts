import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  let token: string | null = null;

  // Only access localStorage if executing in the browser
  if (isPlatformBrowser(platformId)) {
    token = localStorage.getItem('token');
  }

  // Debug logs (remove later)
  console.log('🔑 Interceptor running');
  console.log('Token exists?', !!token);
  console.log('Request URL:', req.url);

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  console.warn('⚠️ No token found – request sent WITHOUT Authorization header');
  return next(req);
};