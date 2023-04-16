/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx,mdx}",],
  theme: {
    extend: {
      boxShadow: {
        mint: '0px 2px 0px #7cc4d6'
      },
      colors: {
        mint: '#7cc4d6'
      }
    },
  },
  plugins: [],
}

