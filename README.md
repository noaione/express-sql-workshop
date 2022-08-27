# Kidocode Workshop — express.js + SQL

This is a workshop project for using express.js and SQL (MySQL/SQLite)

## Backend Stack
- TypeScript
- express.js
- SQLite with Prisma.io ORM

## Frontend Stack
- ES6 JavaScript
- Tailwind CSS

## Running
0. Install [yarn](https://yarnpkg.com/) if you have not.
1. Clone this repository
2. Run `yarn` to isntall all the packages

**For production build:**
1. Run `yarn build` to build the transpiled js files
2. Run `yarn build:css` to compile our custom tailwind css to proper css file
3. Run `yarn start` to start the server

**For development:**
1. Open another terminal
2. In the first terminal, run `yarn watch` to start our web server
3. In the second terminal, run `yarn watch:css` to watch changes to our files so tailwind will rebuilt the files
