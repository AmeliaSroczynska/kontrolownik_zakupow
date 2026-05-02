import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainList from './pages/MainList.jsx';

function App() {
    return (
        <Router>
            <div className="min-h-screen flex justify-center items-start pt-8">
                <Routes>
                    <Route path="/" element={<MainList />} />

                </Routes>
            </div>
        </Router>
    );
}

export default App;