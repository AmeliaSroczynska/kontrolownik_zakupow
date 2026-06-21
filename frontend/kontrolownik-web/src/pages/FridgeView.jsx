import { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Fridge3D from '../components/Fridge3D.jsx';
import { products } from '../api/mockData.js';

// Wizualizacja 3D lodówki z aktualnym stanem produktów.
// Na razie zasilana danymi mockowymi (src/api/mockData.js).
const FridgeView = () => {
    const navigate = useNavigate();

    return (
        <div className="w-full max-w-[360px] bg-zinc-900 rounded-5xl shadow-2xl min-h-[720px] flex flex-col overflow-hidden font-sans relative">
            <div className="flex justify-between items-center p-6 text-white z-10">
                <button onClick={() => navigate('/')} className="active:scale-90 transition-transform">
                    <ArrowLeft size={32} strokeWidth={3} />
                </button>
                <span className="text-xl font-extrabold tracking-tight">Lodówka 3D</span>
                <div className="w-8" />
            </div>

            <div className="relative h-[600px] w-full">
                <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-white font-bold">Ładowanie sceny…</div>}>
                    <Fridge3D products={products} />
                </Suspense>
            </div>

            <div className="absolute bottom-4 inset-x-0 text-center text-zinc-400 text-xs font-medium pointer-events-none">
                Przeciągnij, aby obrócić · scroll = zoom
            </div>
        </div>
    );
};

export default FridgeView;
