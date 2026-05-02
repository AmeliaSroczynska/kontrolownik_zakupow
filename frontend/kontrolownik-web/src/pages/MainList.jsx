import React from 'react';
import { products } from '../api/mockData';
import { Heart } from 'lucide-react';

const MainList = () => {
    return (
        <div className="w-full max-w-[360px] bg-white rounded-5xl p-6 shadow-2xl min-h-[720px] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-2 px-2 mt-2">
                <img src="/logo-bird.svg" alt="logo" className="w-10 h-10" />
                <img src="/logo-bird.svg" alt="logo" className="w-10 h-10 scale-x-[-1]" />
            </div>

            <div className="flex flex-col">
                {products.map((product, index) => {
                    const isLast = index === products.length - 1;
                    const isPercentProduct = ['Ketchup', 'Mleko'].includes(product.name);

                    return (
                        <div
                            key={product.id}
                            style={{
                                zIndex: index,
                                marginTop: index === 0 ? '0px' : '-85px'
                            }}
                            className={`
                                relative
                                ${product.color} 
                                rounded-[3rem] 
                                pt-4 px-8 
                                ${isLast ? 'pb-6' : 'pb-24'} 
                                flex justify-between 
                                items-start 
                                text-white 
                                shadow-lg 
                                transition-transform active:scale-95 cursor-pointer
                            `}
                        >
                            <span className="text-4xl font-extrabold tracking-tight">
                                {product.name}
                            </span>

                            <div className="text-right leading-none">
                                <div className="text-4xl font-extrabold">
                                    {product.quantity}{isPercentProduct ? '%' : ''}
                                </div>

                                <div className="text-[11px] font-semibold opacity-90 tracking-normal mt-1">
                                    {isPercentProduct ? product.unit.replace('% ', '') : product.unit}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-auto pb-8 flex items-center justify-center gap-1.5 text-zinc-400 text-sm font-medium">
                <span>Made with</span>
                <Heart size={16} className="text-[#FF3B5C] fill-[#FF3B5C]" />
                <div className="flex items-center gap-1">
                    <span>by</span>
                    <span className="font-extrabold text-zinc-800">Amelia</span>
                    <span>© 2026</span>
                </div>
            </div>
        </div>
    );
};

export default MainList;