
import React, { useState } from 'react';
// Use a more resilient import pattern to resolve "missing named export" errors in this environment
import * as ReactRouterDOM from 'react-router-dom';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import CreatePost from './pages/CreatePost';
import Notifications from './pages/Notifications';
import Auth from './pages/Auth';
import Navigation from './components/Navigation';
import { AppProvider } from './AppContext';

const { HashRouter: Router, Routes, Route, Navigate } = ReactRouterDOM as any;

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Defaulted to true for demo purposes

  return (
    <AppProvider>
      <Router>
        <div className="flex flex-col min-h-screen max-w-[480px] mx-auto bg-background-light dark:bg-background-dark relative shadow-2xl">
          <Routes>
            {!isAuthenticated ? (
              <Route path="*" element={<Auth onAuth={() => setIsAuthenticated(true)} />} />
            ) : (
              <>
                <Route path="/" element={<Home />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/chat/:id" element={<Chat />} />
                <Route path="/create" element={<CreatePost />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
          
          {isAuthenticated && <Navigation />}
        </div>
      </Router>
    </AppProvider>
  );
};

export default App;
