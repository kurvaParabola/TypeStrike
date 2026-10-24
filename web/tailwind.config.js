/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blockGrass: "#6BBF59",
        blockSky: "#4FA8E0",
        blockSun: "#F6C945",
        blockCoral: "#EF6F61",
        blockPurple: "#9B84D9",
        blockBg: "#DDF1FB",
        blockCream: "#FFF8E7",
        blockText: "#2B3440",
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', '"Silkscreen"', '"Pixelify Sans"', 'cursive', 'monospace'],
        monoTyping: ['"JetBrains Mono"', '"Nunito"', 'monospace'],
      },
      boxShadow: {
        'block': '4px 4px 0px #2B3440',
        'block-lg': '6px 6px 0px #2B3440',
        'block-sm': '2px 2px 0px #2B3440',
        'block-press': '1px 1px 0px #2B3440',
      }
    },
  },
  plugins: [],
}
