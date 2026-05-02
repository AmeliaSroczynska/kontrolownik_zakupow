/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand-yellow': '#F2C94C',
                'brand-pink': '#EB5757',
            },
            borderRadius: {
                '5xl': '3rem',
            }
        },
    },
    plugins: [],
}