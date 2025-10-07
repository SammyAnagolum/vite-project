import { Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import RootLayout from "@/components/layout/RootLayout";
import NotFound from "@/pages/NotFound";
import UserTokensPage from "./pages/iam/UserTokensPage";
import ExpiryDetailsPage from "./pages/iam/secret-expiry/ExpiryDetailsPage";
import TelemetryPage from "./pages/cr/TelemetryPage";
import EntitiesPage from "./pages/cr/EntitiesPage";
import RefreshRatePage from "./pages/iam/entity-tokens/RefreshRatePage";
import GeneratedReportsPage from "./pages/reports/GeneratedReportsPage";
import ExecuteReportsPage from "./pages/reports/ExecuteReportsPage";
import PreferencesPage from "./pages/settings/PreferencesPage";
import ProfilePage from "./pages/profile/ProfilePage";

function Fallback() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">Please reload the page.</p>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary FallbackComponent={Fallback}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<Navigate to="/cr/entities" replace />} />

          {/* CR */}
          <Route path="/cr" element={<Navigate to="/cr/entities" replace />} />
          <Route path="/cr/entities" element={<EntitiesPage />} />
          <Route path="/cr/telemetry" element={<TelemetryPage />} />

          {/* IAM */}
          <Route path="/iam" element={<Navigate to="/iam/secret-expiry/details" replace />} />
          <Route path="/iam/secret-expiry" element={<Navigate to="/iam/secret-expiry/details" replace />} />
          <Route path="/iam/secret-expiry/details" element={<ExpiryDetailsPage />} />
          <Route path="/iam/entity-tokens" element={<Navigate to="/iam/entity-tokens/refresh-rate" replace />} />
          <Route path="/iam/entity-tokens/refresh-rate" element={<RefreshRatePage />} />
          <Route path="/iam/user-tokens" element={<UserTokensPage />} />

          {/* Reports */}
          <Route path="/reports" element={<Navigate to="/reports/execute-reports" replace />} />
          <Route path="/reports/execute-reports" element={<ExecuteReportsPage />} />
          <Route path="/reports/generated-reports" element={<><GeneratedReportsPage /></>} />

          {/* Settings */}
          <Route path="/settings" element={<PreferencesPage />} />

          {/* Profile */}
          <Route path="/profile" element={<ProfilePage />} />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
