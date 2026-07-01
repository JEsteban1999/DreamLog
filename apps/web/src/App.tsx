import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { RequireAuth } from "./components/layout/RequireAuth";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { SleepLog } from "./pages/SleepLog";
import { NewEntry } from "./pages/NewEntry";
import { MorningEntry } from "./pages/MorningEntry";
import { EntryDetail } from "./pages/EntryDetail";
import { AIChat } from "./pages/AIChat";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { useAuthStore } from "./store/auth.store";

function App() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="log" element={<SleepLog />} />
        <Route path="log/new" element={<NewEntry />} />
        <Route path="log/:id/morning" element={<MorningEntry />} />
        <Route path="log/:id" element={<EntryDetail />} />
        <Route path="chat" element={<AIChat />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
