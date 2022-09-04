const cssNano = require('cssnano');

const plugins = [require("tailwindcss"), require("autoprefixer")]

if (process.env.NODE_ENV === "production") {
    plugins.push(cssNano({ preset: "default" }))
}

module.exports = {
    plugins: plugins,
}