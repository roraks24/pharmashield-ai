import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import IntakePage from './pages/IntakePage';
import ComplaintsPage from './pages/ComplaintsPage';
import ComplaintDetail from './components/complaints/ComplaintDetail';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<IntakePage />} />
        <Route path="/complaints" element={<ComplaintsPage />} />
        <Route path="/complaints/:id" element={<ComplaintDetail />} />
      </Routes>
    </Layout>
  );
}

export default App;
