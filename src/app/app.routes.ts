import { Routes } from '@angular/router';
import { Landing } from './component/landing/landing';
import { Register } from './component/register/register';
import { Dashboard } from './component/dashboard/dashboard';
import { Directory } from './component/directory/directory';
import { Admin } from './component/admin/admin';
import { Login } from './component/login/login';
import { authGuard } from './guards/auth-guard';
import { ForgortPassword } from './component/forgort-password/forgort-password';

export const routes: Routes = [
  // 1. The Main/Home Page Route
  { 
    path: '', 
    component: Landing,
    pathMatch: 'full' 
  },
  {  path: 'directory',  component:Directory },
 
  { path: 'register', component: Register },
  { path: 'forgot-password', component: ForgortPassword  },
  
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
    data: { roles: ['vendor'] }
  },
  {  path: 'admin',  component:Admin, 
    canActivate: [authGuard],
    data: { roles: ['admin'] } },
  {  path: 'login',  component:Login} 
];
