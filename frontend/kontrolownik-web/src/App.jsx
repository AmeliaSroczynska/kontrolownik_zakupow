import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainList from './pages/MainList.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import FridgeView from './pages/FridgeView.jsx';

function App() {
    return (
        <Router>
            <div className="min-h-screen w-full flex justify-center items-start pt-8">
                <Routes>
                    <Route path="/" element={<MainList />} />
                    <Route path="/product/:slug" element={<ProductDetail />} />
                    <Route path="/fridge" element={<FridgeView />} />

                </Routes>
            </div>
        </Router>
    );
}

export default App;