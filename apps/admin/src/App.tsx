import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import ParticipantsPage from './pages/ParticipantsPage';
import GroupsPage from './pages/GroupsPage';
import SupportPage from './pages/SupportPage';
import MatchingPage from './pages/MatchingPage';
import Sidebar from './components/Sidebar';

function App() {
    return (
        <BrowserRouter>
            <div className="admin-layout">
                <Sidebar />
                <main className="admin-main">
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/participants" element={<ParticipantsPage />} />
                        <Route path="/groups" element={<GroupsPage />} />
                        <Route path="/support" element={<SupportPage />} />
                        <Route path="/matching" element={<MatchingPage />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
