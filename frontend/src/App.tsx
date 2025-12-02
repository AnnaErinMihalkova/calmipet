import React, { useState, useEffect } from 'react';
import SignUp from './components/SignUp';
import Login from './components/Login';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState<'signup' | 'login'>('signup');

  useEffect(() => {
    // Check URL hash for routing
    const hash = window.location.hash;
    if (hash === '#login') {
      setCurrentPage('login');
    } else if (hash === '#signup') {
      setCurrentPage('signup');
    }
  }, []);

  // Update URL hash when page changes
  useEffect(() => {
    window.location.hash = currentPage;
  }, [currentPage]);

  return (
    <div className="App">
      {currentPage === 'signup' ? (
        <SignUp onNavigateToLogin={() => setCurrentPage('login')} />
      ) : (
        <Login onNavigateToSignup={() => setCurrentPage('signup')} />
      )}
    </div>
  );
}

export default App;
