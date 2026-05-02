import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus } from 'lucide-react';

const colorMap = {
    'Ser': 'bg-[#F2C953]',
    'Szynka': 'bg-[#FF9393]',
    'Tosty': 'bg-[#D1A878]',
    'Ketchup': 'bg-[#F85555]',
    'Kawa': 'bg-[#896B50]',
    'Mleko': 'bg-[#BABABA]'
};

const ProductDetail = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);

    useEffect(() => {
        fetch(`http://127.0.0.1:8000/api/products/${slug}/`)
            .then(res => res.json())
            .then(data => setProduct(data))
            .catch(err => console.error(err));
    }, [slug]);

    const handleAction = async (endpoint) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/products/${slug}/${endpoint}/`, {
                method: 'POST',
            });
            const data = await res.json();
            if (res.ok) {
                setProduct(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!product) return <div className="text-center mt-20 font-bold font-sans">Pobieranie...</div>;

    const isPercentProduct = ['Ketchup', 'Mleko'].includes(product.name);
    const bgColor = colorMap[product.name] || 'bg-zinc-500';

    return (
        <div className={`w-full max-w-[360px] ${bgColor} min-h-[720px] flex flex-col relative overflow-hidden font-sans`}>
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
                        Zaznacz ile {isPercentProduct ? 'procent' : product.unit_display} bierzesz
                    </p>
                </div>
                <img src={`/images/${product.slug}.png`} alt={product.name} className="absolute right-1 top-24 w-48 h-48 object-contain drop-shadow-2xl z-20" />
            </div>

            <div className="flex-1 bg-white rounded-t-[3.5rem] flex flex-col items-center justify-center p-8 relative z-10">
                <div className="flex items-center gap-6 mb-2">
                    <button onClick={() => handleAction('take')} className="text-black active:scale-75 transition-transform">
                        <Minus size={48} strokeWidth={5} />
                    </button>
                    <span className="text-8xl font-extrabold text-zinc-900 min-w-[140px] text-center tracking-tighter">
                        {product.quantity}{isPercentProduct ? '%' : ''}
                    </span>
                    <button onClick={() => handleAction('add')} className="text-black active:scale-75 transition-transform">
                        <Plus size={48} strokeWidth={5} />
                    </button>
                </div>
                <span className="text-2xl font-bold text-black mb-12 tracking-tight">
                    {isPercentProduct ? product.unit_display.replace('% ', '') : product.unit_display}
                </span>
                <button onClick={() => navigate('/')} className={`w-full ${bgColor} py-5 rounded-3xl text-3xl font-extrabold text-zinc-800 shadow-lg active:scale-95 transition-all`}>
                    Zapisz
                </button>
            </div>
        </div>
    );
};

export default ProductDetail;