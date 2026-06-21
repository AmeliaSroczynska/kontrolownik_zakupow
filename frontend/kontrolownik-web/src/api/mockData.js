export const products = [
    { id: 1, name: 'Ser', slug: 'ser', quantity: 10, unit: 'plasterków', color: 'bg-brand-yellow', hex: '#F2C953', image: '/images/cheese.png' },
    { id: 2, name: 'Szynka', slug: 'szynka', quantity: 5, unit: 'plasterków', color: 'bg-brand-pink', hex: '#FF9393', image: '/images/ham.png' },
    { id: 3, name: 'Tosty', slug: 'tosty', quantity: 20, unit: 'kawałków', color: 'bg-brand-brown', hex: '#D1A878', image: '/images/tost.png' },
    { id: 4, name: 'Ketchup', slug: 'ketchup', quantity: 25, unit: '% butelki', color: 'bg-brand-gray', hex: '#F85555', image: '/images/ketchup.png' },
    { id: 5, name: 'Kawa', slug: 'kawa', quantity: 15, unit: 'kapsułek', color: 'bg-brand-orange', hex: '#896B50', image: '/images/coffee.png' },
    { id: 6, name: 'Mleko', slug: 'mleko', quantity: 50, unit: '% kartonu', color: 'bg-brand-tan', hex: '#BABABA', image: '/images/milk.png' },
];

// The Django API exposes `unit_display`; mock data uses `unit`. Normalize so the
// UI components can rely on the same shape whether online or offline.
const toApiShape = (p) => ({ ...p, unit_display: p.unit });

export const mockProducts = products.map(toApiShape);

export const getMockProduct = (slug) =>
    mockProducts.find((p) => p.slug === slug) || null;
