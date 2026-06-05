/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        // BoBo Brand Colors
        bobo: {
          black: '#1A1A1A',
          white: '#FAFAFA',
          cream: '#F5F0E8',
          accent: '#C8A96E', // Vàng gold nhẹ
          'accent-dark': '#A8894E',
          gray: {
            50: '#F9F9F9',
            100: '#F0F0F0',
            200: '#E0E0E0',
            300: '#BDBDBD',
            500: '#757575',
            700: '#424242',
            900: '#212121',
          },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideInRight: { '0%': { transform: 'translateX(100%)' }, '100%': { transform: 'translateX(0)' } },
      },
      aspectRatio: {
        'product': '3/4', // Tỷ lệ ảnh sản phẩm thời trang chuẩn
      },
    },
  },
  plugins: [],
};
