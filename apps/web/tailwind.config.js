/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0A0B1E",
        surface: "#12142B",
        primary: "#7C3AED",
        accent: "#22D3EE",
        danger: "#F43F5E",
        success: "#10B981",
        warning: "#F59E0B",
        textPrimary: "#F1F5F9",
        textMuted: "#94A3B8",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        neonPrimary: "0 0 15px rgba(124, 58, 237, 0.5)",
        neonAccent: "0 0 15px rgba(34, 211, 238, 0.5)",
        neonDanger: "0 0 15px rgba(244, 63, 94, 0.5)",
        neonSuccess: "0 0 15px rgba(16, 185, 129, 0.5)",
      },
    },
  },
  plugins: [],
}
