import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";

const Login = lazy(() => import("@/pages/Login"));
const Home = lazy(() => import("@/pages/Home"));
const Items = lazy(() => import("@/pages/Items"));
const ItemDetail = lazy(() => import("@/pages/ItemDetail"));
const Sellers = lazy(() => import("@/pages/Sellers"));
const SellerDetail = lazy(() => import("@/pages/SellerDetail"));
const Hauls = lazy(() => import("@/pages/Hauls"));
const HaulDetail = lazy(() => import("@/pages/HaulDetail"));
const Radar = lazy(() => import("@/pages/Radar"));
const Insights = lazy(() => import("@/pages/Insights"));
const Settings = lazy(() => import("@/pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AppShell = lazy(() => import("@/components/layout/AppShell"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 2 * 60 * 1000 },
  },
});

function Protected() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<Protected />}>
                  <Route element={<AppShell />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/items" element={<Items />} />
                    <Route path="/items/:id" element={<ItemDetail />} />
                    <Route path="/sellers" element={<Sellers />} />
                    <Route path="/sellers/:id" element={<SellerDetail />} />
                    <Route path="/hauls" element={<Hauls />} />
                    <Route path="/hauls/:id" element={<HaulDetail />} />
                    <Route path="/radar" element={<Radar />} />
                    <Route path="/insights" element={<Insights />} />
                    <Route path="/settings" element={<Settings />} />
                  </Route>
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
