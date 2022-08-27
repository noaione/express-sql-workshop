const colors = require("tailwindcss/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{css,ts,tsx}",
    "./public/**/*.{css,html,js}",
  ],
  theme: {
    // change to neutral
    extend: {
      colors: {
        gray: colors.neutral
      }
    }
  },
  plugins: [require("@tailwindcss/forms")],
}
