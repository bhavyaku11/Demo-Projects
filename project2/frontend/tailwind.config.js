/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      colors: {
        brand: {
          bg: "#020617",
          surface: "#0f172a",
          surfaceElevated: "#111c34",
          surfaceSoft: "#16213d",
          line: "#1e293b",
          text: "#e2e8f0",
          muted: "#94a3b8",
          blue: "#3b82f6",
          indigo: "#6366f1",
          violet: "#8b5cf6",
          cyan: "#22d3ee",
          cyanSoft: "#67e8f9"
        }
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #3b82f6 0%, #6366f1 48%, #8b5cf6 100%)",
        "brand-mesh":
          "radial-gradient(circle at top left, rgba(99,102,241,0.22), transparent 24%), radial-gradient(circle at top right, rgba(34,211,238,0.14), transparent 26%), radial-gradient(circle at 50% 120%, rgba(59,130,246,0.18), transparent 34%)"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(2, 6, 23, 0.22)",
        glass: "0 24px 80px rgba(2, 6, 23, 0.42)",
        glow: "0 0 0 1px rgba(34, 211, 238, 0.14), 0 18px 40px rgba(34, 211, 238, 0.12)",
        panel: "0 28px 70px rgba(2, 6, 23, 0.48)"
      },
      backdropBlur: {
        xs: "2px"
      },
      transitionTimingFunction: {
        dashboard: "cubic-bezier(0.22, 1, 0.36, 1)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" }
        }
      },
      animation: {
        float: "float 8s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
