import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { products } from '../api/mockData';
import { ArrowLeft, Plus, Minus } from 'lucide-react';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const product = products.find(p => p.id === parseInt(id));
    const [count, setCount] = useState(product?.quantity || 0);

    if (!product) return <div className="text-white text-center mt-20 font-bold text-2xl font-sans">Produkt nie znaleziony</div>;

    const isPercentProduct = ['Ketchup', 'Mleko'].includes(product.name);

    return (
        <div className={`w-full max-w-[360px] ${product.color} min-h-[720px] flex flex-col relative overflow-hidden font-sans`}>
            <div className="flex justify-between items-center p-6 text-white">
                <button onClick={() => navigate('/')} className="active:scale-90 transition-transform">
                    <ArrowLeft size={36} strokeWidth={3} />
                </button>
                <img src="/logo-bird.svg" alt="logo" className="w-12 h-12 brightness-0 scale-x-[-1]" />
            </div>

            <div className="px-8 pt-4 pb-20 relative">
                <div className="max-w-[55%]">
                    <h1 className="text-7xl font-extrabold text-white tracking-tighter leading-none mb-6">
                        {product.name}
                    </h1>
                    <p className="text-white text-lg font-medium leading-tight opacity-90 pr-2">
                        Zaznacz ile {isPercentProduct ? 'procent' : product.unit} bierzesz
                    </p>
                </div>

                <img
                    src={product.image}
                    alt={product.name}
                    className="absolute right-1 top-24 w-48 h-48 object-contain drop-shadow-2xl z-20"
                />
            </div>

            <div className="flex-1 bg-white rounded-t-[3.5rem] flex flex-col items-center justify-center p-8 relative z-10">
                <div className="flex items-center gap-6 mb-2">
                    <button
                        onClick={() => setCount(Math.max(0, count - 1))}
                        className="text-black active:scale-75 transition-transform"
                    >
                        <Minus size={48} strokeWidth={5} />
                    </button>

                    <span className="text-8xl font-extrabold text-zinc-900 min-w-[140px] text-center tracking-tighter">
                        {count}{isPercentProduct ? '%' : ''}
                    </span>

                    <button
                        onClick={() => setCount(count + 1)}
                        className="text-black active:scale-75 transition-transform"
                    >
                        <Plus size={48} strokeWidth={5} />
                    </button>
                </div>

                <span className="text-2xl font-bold text-black mb-12 tracking-tight">
                    {isPercentProduct ? product.unit.replace('% ', '') : product.unit}
                </span>

                <button
                    onClick={() => navigate('/')}
                    className={`w-full ${product.color} py-5 rounded-3xl text-3xl font-extrabold text-zinc-800 shadow-lg active:scale-95 transition-all`}
                >
                    Zmień
                </button>
            </div>
        </div>
    );
};

export default ProductDetail;