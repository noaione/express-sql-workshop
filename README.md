# Kidocode Workshop — express.js + SQL

This is a workshop project for using express.js and SQL (MySQL/SQLite)

## Backend Stack
- [TypeScript](https://www.typescriptlang.org/)
- [express.js](https://expressjs.com/)
- SQLite with [Prisma.io ORM](https://prisma.io/)

## Frontend Stack
- ES6 JavaScript
- [Tailwind CSS](https://tailwindcss.com/)

## Running
0. Install [yarn](https://yarnpkg.com/) if you have not.
1. Clone this repository
2. Run `yarn` to install all the packages

**For production build:**
1. Run `yarn build` to build the transpiled js files
2. Run `yarn build:css` to compile our custom tailwind css to proper css file
3. Run `yarn start` to start the server

**For development:**
1. Open another terminal
2. In the first terminal, run `yarn watch` to start our web server
3. In the second terminal, run `yarn watch:css` to watch changes to our files so tailwind will rebuilt the files

You can also see our [GUIDES](GUIDES.md) to see how this project is created.

## Acknowledgments
Favicons are created using `key-outline` icons from [Material Design Icons](https://materialdesignicons.com/) and most of our icons are taken from [heroicons](https://heroicons.com/).

## License
This project is open sourced with [MIT License](LICENSE)
