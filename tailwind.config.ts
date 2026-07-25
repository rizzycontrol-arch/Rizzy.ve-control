import type { Config } from "tailwindcss";
const config: Config = {
content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
theme: {
extend: {
colors: {
ink: "#3B1140",
pink: {
700: "#B81A6B",
600: "#EC2286",
500: "#F0429A",
200: "#F8B9D8",
100: "#FCE4F1",
},
teal: { 500: "#0FA7AC", 100: "#DEF6F5" },
amber: { 500: "#FA8818", 700: "#C4650C" },
coral: { 500: "#E4573B" },
lav: { bg: "#F7E9FA" },
muted: { 700: "#8A4D82" },
cream: { 50: "#FFFFFF" },
violet: { 900: "#3B1140" },
},
borderRadius: { rz: "18px" },
fontFamily: {
baloo: ["var(--font-baloo)", "sans-serif"],
quicksand: ["var(--font-quicksand)", "sans-serif"],
mono: ["var(--font-plex-mono)", "monospace"],
},
},
},
plugins: [],
};
export default config;