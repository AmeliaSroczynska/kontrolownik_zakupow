const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

async function request(path, options) {
    const res = await fetch(`${API_BASE}/api${path}`, options);
    if (!res.ok) {
        throw new Error(`API ${res.status} ${res.statusText}`);
    }
    return res.json();
}

export function fetchProducts() {
    return request('/products/');
}

export function fetchProduct(slug) {
    return request(`/products/${slug}/`);
}

export function changeStock(slug, action) {
    return request(`/products/${slug}/${action}/`, { method: 'POST' });
}
