import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import GroupsPage from './pages/GroupsPage';
import FeedbackPage from './pages/FeedbackPage';
import SupportPage from './pages/SupportPage';

function App() {
    return (
        <BrowserRouter>
            <div className="app">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/groups" element={<GroupsPage />} />
                    <Route path="/feedback" element={<FeedbackPage />} />
                    <Route path="/support" element={<SupportPage />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
