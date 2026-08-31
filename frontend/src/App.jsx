import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { isAuthenticated } from './services/tokenSlice';

// Protected Route Component (Agar user login nahi hai toh login page par bhej dega)
const ProtectedRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

export default function App() {
    return (
        <Router>
            <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Dashboard Route (Yahan apna Dashboard component lagayein baad mein) */}
                <Route 
                    path="/dashboard" 
                    element={
                        <ProtectedRoute>
                            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                                <div className="bg-white p-8 rounded-xl shadow-md text-center">
                                    <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome to Dashboard!</h1>
                                    <p className="text-slate-600 mb-6">Phase 2 Authentication is successfully integrated and working.</p>
                                    <button 
                                        onClick={() => {
                                            localStorage.clear();
                                            window.location.href = '/login';
                                        }}
                                        className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </div>
                        </ProtectedRoute>
                    } 
                />

                {/* Default Root Redirect */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
}