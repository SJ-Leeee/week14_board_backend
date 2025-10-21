/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 크래프톤 정글 그린 - 포인트 컬러로 사용
        jungle: {
          DEFAULT: '#82b553',
          light: '#9cc976',
          dark: '#6a9844',
        },
      },
    },
  },
  plugins: [],
};
