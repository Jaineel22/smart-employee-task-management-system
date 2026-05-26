// /** @type {import('tailwindcss').Config} */
// export default {
//   content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
//   theme: { extend: {} },
//   plugins: [],
// }



export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Plus Jakarta Sans", "sans-serif"] },
      colors: {
        navy: { DEFAULT: "#0A1628", 2: "#0F2044", 3: "#1A3260" },
        brand: { DEFAULT: "#2563EB", light: "#3B82F6" },
      },
    },
  },
  plugins: [],
};