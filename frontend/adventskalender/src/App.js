import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdventCalendar from './components/AdventCalendar';
import Admin from './admin/Admin';
import PasswordProtection from './components/PasswordProtection'; // Neue Import-Zeile

function App() {
  return (
    <>
      <PasswordProtection />
      <Router>
        <Routes>
          <Route path="/" element={<AdventCalendar />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;