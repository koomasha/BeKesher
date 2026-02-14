import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useConvexAuth } from 'convex/react';
import DashboardPage from './pages/DashboardPage';
import ParticipantsPage from './pages/ParticipantsPage';
import GroupsPage from './pages/GroupsPage';
import FeedbackPage from './pages/FeedbackPage';
import SupportPage from './pages/SupportPage';
import MatchingPage from './pages/MatchingPage';
import Sidebar from './components/Sidebar';
import LoginPage from './components/LoginPage';
import { useAdminAuth } from './hooks/useAdminAuth';

function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isLoading, isAuthenticated } = useConvexAuth();

    if (isLoading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                <p>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}

function App() {
    const { login } = useAdminAuth();

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage onLogin={login} />} />
                <Route
                    path="/*"
                    element={
                        <AuthGuard>
                            <div className="admin-layout">
                                <Sidebar />
                                <main className="admin-main">
                                    <Routes>
                                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                        <Route path="/dashboard" element={<DashboardPage />} />
                                        <Route path="/participants" element={<ParticipantsPage />} />
                                        <Route path="/groups" element={<GroupsPage />} />
                                        <Route path="/feedback" element={<FeedbackPage />} />
                                        <Route path="/support" element={<SupportPage />} />
                                        <Route path="/matching" element={<MatchingPage />} />
                                    </Routes>
                                </main>
                            </div>
                        </AuthGuard>
                    }
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
