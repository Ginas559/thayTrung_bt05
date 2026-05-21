import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import LoginPage from './pages/login.jsx';
import RegisterPage from './pages/register.jsx';
import ForgotPasswordPage from './pages/forgot-password.jsx';
import UserPage from './pages/user.jsx';
import HomePage from './pages/home.jsx';
import SearchPage from './pages/search.jsx';
import KeyboardDetailPage from './pages/keyboard-detail.jsx';
import NewsPage from './pages/news.jsx';
import NewsDetailPage from './pages/news-detail.jsx';
import CartPage from './pages/cart.jsx';
import OrdersPage from './pages/orders.jsx';
import CheckoutPage from './pages/checkout.jsx';
import OrderDetailPage from './pages/order-detail.jsx';
import AdminOrdersPage from './pages/admin-orders.jsx';
import { AuthWrapper } from './components/context/auth.wrapper.jsx';
import { RequireAdmin, RequireAdminOrStaff } from './components/route/guards.jsx';
import './styles/global.css';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "admin",
        element: <RequireAdmin><UserPage /></RequireAdmin>,
      },
      {
        path: "admin/orders",
        element: <RequireAdminOrStaff><AdminOrdersPage /></RequireAdminOrStaff>,
      },
      {
        path: "search",
        element: <SearchPage />,
      },
      {
        path: "news",
        element: <NewsPage />,
      },
      {
        path: "news/:id",
        element: <NewsDetailPage />,
      },
      {
        path: "keyboard/:id",
        element: <KeyboardDetailPage />,
      },
      {
        path: "cart",
        element: <CartPage />,
      },
      {
        path: "checkout",
        element: <CheckoutPage />,
      },
      {
        path: "orders",
        element: <OrdersPage />,
      },
      {
        path: "orders/:id",
        element: <OrderDetailPage />,
      },
      {
        path: "orders/success/:id",
        element: <OrderDetailPage />,
      },
    ],
  },
  {
    path: "login",
    element: <LoginPage />,
  },
  {
    path: "register",
    element: <RegisterPage />,
  },
  {
    path: "forgot-password",
    element: <ForgotPasswordPage />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthWrapper>
      <RouterProvider router={router} />
    </AuthWrapper>
  </React.StrictMode>,
)