import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

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