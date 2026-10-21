import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { AdminLayoutComponent } from './layouts/admin-layout.component';
import { PublicLayoutComponent } from './layouts/public-layout.component';

export const routes: Routes = [
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        title: 'Dashboard · Don Pepito',
        loadComponent: () =>
          import('./pages/admin/dashboard/dashboard.page').then(
            (module) => module.AdminDashboardPageComponent,
          ),
      },
      {
        path: 'pedidos',
        title: 'Pedidos · Don Pepito',
        loadComponent: () =>
          import('./pages/admin/orders/orders.page').then(
            (module) => module.AdminOrdersPageComponent,
          ),
      },
      {
        path: 'productos',
        title: 'Productos · Don Pepito',
        loadComponent: () =>
          import('./pages/admin/products/products.page').then(
            (module) => module.AdminProductsPageComponent,
          ),
      },
      {
        path: 'categorias',
        title: 'Categorías · Don Pepito',
        loadComponent: () =>
          import('./pages/admin/categories/categories.page').then(
            (module) => module.AdminCategoriesPageComponent,
          ),
      },
      {
        path: 'clientes',
        title: 'Clientes · Don Pepito',
        loadComponent: () =>
          import('./pages/admin/clients/clients.page').then(
            (module) => module.AdminClientsPageComponent,
          ),
      },
      {
        path: 'puntos',
        title: 'Puntos · Don Pepito',
        loadComponent: () =>
          import('./pages/admin/points/points.page').then(
            (module) => module.AdminPointsPageComponent,
          ),
      },
      {
        path: 'usuarios',
        title: 'Usuarios y roles · Don Pepito',
        loadComponent: () =>
          import('./pages/admin/users/users.page').then(
            (module) => module.AdminUsersPageComponent,
          ),
      },
      {
        path: 'mesas',
        title: 'Mesas · Don Pepito',
        loadComponent: () =>
          import('./pages/admin/tables/tables.page').then(
            (module) => module.AdminTablesPageComponent,
          ),
      },
      {
        path: 'reservas',
        title: 'Reservas · Don Pepito',
        loadComponent: () =>
          import('./pages/admin/reservations/reservations.page').then(
            (module) => module.AdminReservationsPageComponent,
          ),
      },
      {
        path: 'reportes',
        title: 'Reportes · Don Pepito',
        loadComponent: () =>
          import('./pages/admin/reports/reports.page').then(
            (module) => module.AdminReportsPageComponent,
          ),
      },
      {
        path: 'configuracion',
        title: 'Configuración · Don Pepito',
        loadComponent: () =>
          import('./pages/admin/settings/settings.page').then(
            (module) => module.AdminSettingsPageComponent,
          ),
      },
      { path: '**', redirectTo: '' },
    ],
  },
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      {
        path: '',
        title: 'Pollería Don Pepito · El sabor de Ica',
        loadComponent: () =>
          import('./pages/home/home.page').then(
            (module) => module.HomePageComponent,
          ),
      },
      {
        path: 'carta',
        title: 'La carta · Don Pepito',
        loadComponent: () =>
          import('./pages/menu/menu.page').then(
            (module) => module.MenuPageComponent,
          ),
      },
      {
        path: 'promociones',
        title: 'Promociones · Don Pepito',
        loadComponent: () =>
          import('./pages/promotions/promotions.page').then(
            (module) => module.PromotionsPageComponent,
          ),
      },
      {
        path: 'nosotros',
        title: 'Nosotros · Don Pepito',
        loadComponent: () =>
          import('./pages/about/about.page').then(
            (module) => module.AboutPageComponent,
          ),
      },
      {
        path: 'contacto',
        title: 'Contacto · Don Pepito',
        loadComponent: () =>
          import('./pages/contact/contact.page').then(
            (module) => module.ContactPageComponent,
          ),
      },
      {
        path: 'reservas',
        title: 'Reservar una mesa · Don Pepito',
        loadComponent: () =>
          import('./pages/reservations/reservations.page').then(
            (module) => module.ReservationsPageComponent,
          ),
      },
      {
        path: 'carrito',
        title: 'Tu carrito · Don Pepito',
        loadComponent: () =>
          import('./pages/cart/cart.page').then(
            (module) => module.CartPageComponent,
          ),
      },
      {
        path: 'checkout',
        title: 'Checkout · Don Pepito',
        loadComponent: () =>
          import('./pages/checkout/checkout.page').then(
            (module) => module.CheckoutPageComponent,
          ),
      },
      {
        path: 'pedido/:codigo',
        title: 'Seguimiento de pedido · Don Pepito',
        loadComponent: () =>
          import('./pages/order-tracking/order-tracking.page').then(
            (module) => module.OrderTrackingPageComponent,
          ),
      },
      {
        path: 'cuenta',
        title: 'Mi cuenta · Don Pepito',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/account/account.page').then(
            (module) => module.AccountPageComponent,
          ),
      },
      {
        path: 'auth',
        title: 'Iniciar sesión · Don Pepito',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./pages/auth/login.page').then(
            (module) => module.LoginPageComponent,
          ),
      },
      {
        path: 'login',
        title: 'Iniciar sesión · Don Pepito',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./pages/auth/login.page').then(
            (module) => module.LoginPageComponent,
          ),
      },
      {
        path: 'register',
        title: 'Crear cuenta · Don Pepito',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./pages/auth/register.page').then(
            (module) => module.RegisterPageComponent,
          ),
      },
      {
        path: 'registro',
        title: 'Crear cuenta · Don Pepito',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./pages/auth/register.page').then(
            (module) => module.RegisterPageComponent,
          ),
      },
      {
        path: 'legal/terminos',
        title: 'Términos y condiciones · Don Pepito',
        data: { tipo: 'terminos' },
        loadComponent: () =>
          import('./pages/legal/legal.page').then(
            (module) => module.LegalPageComponent,
          ),
      },
      {
        path: 'legal/privacidad',
        title: 'Política de privacidad · Don Pepito',
        data: { tipo: 'privacidad' },
        loadComponent: () =>
          import('./pages/legal/legal.page').then(
            (module) => module.LegalPageComponent,
          ),
      },
      {
        path: 'legal/reclamos',
        title: 'Libro de reclamaciones · Don Pepito',
        data: { tipo: 'reclamos' },
        loadComponent: () =>
          import('./pages/legal/legal.page').then(
            (module) => module.LegalPageComponent,
          ),
      },
      {
        path: 'legal/libro-reclamaciones',
        title: 'Libro de reclamaciones · Don Pepito',
        data: { tipo: 'reclamos' },
        loadComponent: () =>
          import('./pages/legal/legal.page').then(
            (module) => module.LegalPageComponent,
          ),
      },
      {
        path: 'legal/puntos',
        title: 'Reglamento de puntos · Don Pepito',
        data: { tipo: 'puntos' },
        loadComponent: () =>
          import('./pages/legal/legal.page').then(
            (module) => module.LegalPageComponent,
          ),
      },
      {
        path: 'terminos',
        redirectTo: 'legal/terminos',
        pathMatch: 'full',
      },
      {
        path: 'privacidad',
        redirectTo: 'legal/privacidad',
        pathMatch: 'full',
      },
      {
        path: 'libro-de-reclamaciones',
        redirectTo: 'legal/libro-reclamaciones',
        pathMatch: 'full',
      },
      { path: '**', redirectTo: '' },
    ],
  },
];
