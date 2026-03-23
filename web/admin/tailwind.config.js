/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 二次元粉色系主色调
        background: '#fef6fb',
        foreground: '#3d3d3d',
        card: '#ffffff',
        border: '#f0b6d4',
        
        // 主色 - 可爱粉
        primary: '#ff6b9d',
        'primary-light': '#ffa0c4',
        'primary-dark': '#e8457a',
        
        // 辅助色 - 天空蓝
        accent: '#64b5f6',
        'accent-light': '#90caf9',
        
        // 状态色
        success: '#81c784',
        danger: '#ef5350',
        warning: '#ffb74d',
        
        // 涨跌色
        up: '#ef5350',
        down: '#66bb6a',
        
        // 分类色
        'cat-virtual': '#e91e63',
        'cat-historical': '#9c27b0',
        'cat-novel': '#2196f3',
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif'],
      },
      borderRadius: {
        'cute': '16px',
        'cute-lg': '24px',
      },
      boxShadow: {
        'cute': '0 4px 20px rgba(255, 107, 157, 0.15)',
        'cute-hover': '0 8px 30px rgba(255, 107, 157, 0.25)',
      },
    },
  },
  plugins: [],
}
