import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdventCalendar from './components/AdventCalendar';
import Admin from './admin/Admin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdventCalendar />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  );
}

export default App;