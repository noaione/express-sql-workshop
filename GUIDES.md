# Kidocode Workshop — express.js with SQL database

### QoL Extension for VSCode
- [JavaScript and TypeScript Nightly](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next)
- [Prisma](https://marketplace.visualstudio.com/items?itemName=Prisma.prisma)
- [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

## Backend Section

1. Prepare `yarn` if you haven’t (yarn is a package manager for nodejs)
2. Create a new folder with the name `simple-passwd-manager` or anything you want
3. Open terminal in that folder and type: `yarn init`
    a. The above command will initialize your project, follow it properly
4. Now, let’s install some of our development tools and packages (go to [#package explanation](#package-explanation) for explanation of our packages)
  	a. express.js: `yarn add express express-session` (`express-session` to manage our login session)
    b. TypeScript: `yarn add --dev typescript ts-node ts-node-dev @types/node @types/express @types/express-session`
    c. Prisma: `yarn add --dev prisma` and `yarn add @prisma/client`
5. Create the following folder: `public`, `prisma`, and `src`

### TypeScript
We first need to prepare our typescript project, after finishing the above section. Run the following command: `npx tsc --init`<br />
The above command will create a new tsconfig.json which you need to edit

**Enable**
- `resolveJsonModule`
- `sourceMap`
- `esModuleInterop`
- `forceConsistentCasingInFileNames`
- `strict`
- `skipLibCheck`

**Set**
- `target` -> `es2016`
- `lib` -> `["ESNext", "ESNext.Array"]`
- `module` -> `commonjs`
- `outDir` -> `./dist`

Then open your package.json file, and add `scripts` key if it's missing and add the following dictionary data:
```json
[...]
"scripts": {
    "start": "node ./dist/index.js",
    "dev": "ts-node --transpile-only ./src/index.ts",
    "build": "tsc",
    "watch": "ts-node-dev --respawn --transpile-only ./src/index.ts",
},
[...]
```

### Prisma ORM (Database)
Now, Let's setup our database system, we will be using Prisma ORM to help map our document into TypeScript or JavaScript.

In the same folder, type in terminal: `npx prisma init --datasource-provider sqlite` this command will initate prisma with SQLite backend.

After that, open the `prisma/schema.prisma` file and let's create our database schema:
- Our database need user model and our password collection model
- Name our user model: `User` and password collection as `PasswordBank`

```prisma
model User {

}

model PasswordBank {

}
```

Inside `User`, we need to define our user id, email, password, and their password collection.

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String  // plaintext password, not hashed
  banks     PasswordBank[]
}
```
**Explanation!**
- `@id @default(autoincrement())` set our `id` key as the SQL ID, and the default will be an auto increment number
- `@unique` will make our email unique and not allow any duplicates
- `[]` symbol will mark that as a list (so `PasswordBank[]` would be a list of `PasswordBank`)

Inside `PasswordBank`, we need to define the ID, email, and password. We also need to add relation to our `User` data that will mark that specific password data for specific user.

```prisma
model PasswordBank {
  id          Int      @id @default(autoincrement())
  email       String
  password    String
  user        User     @relation(fields: [userId], references: [id])
  userId      Int
  lastUpdated DateTime @default(now())
}
```
**Explanation!**
- `User    @relation(fields: [userId], references: [id])` would means that we are referencing our `User` model for this `PasswordBank`, the `fields` area will be one of the fields in the `PasswordBank` while the `references` will be any field in the `User` model.
- `DateTime @default(now())` would set the current time

After that, we need to generate our prisma client data.<br/>
**Execute:**
1. `npx prisma migrate dev --name init` (create a migration data)
2. `npx prisma generate` generate the actual data to be used in our script.

### Source Code

#### `src/utils.ts`
Our utility files include some file that we will generally use multiple times.

**We first need to create a `isNone` function which will check if a value is `null` or `undefined`**

```ts
/**
 * Check if our value is undefined or null
 * @param value Value to be checked
 * @returns True if value is null or undefined
 */
export function isNone(value) {
    return value === null || value === undefined;
}
```

To make it TypeScript friendly and we can see all the type hints and warning, we need to mark our function with some TS-only feature.

```ts
type Undefined = null | undefined;

export function isNone(value: any): value is Undefined {
    return value === null || value === undefined;
}
```

The above typing basically tells our TS compiler properly.

**After that, let's create `wrapJSON` function which will make our JSON response consistent.

```ts
/**
 * Wrap our data response in an unified response format
 * @param res Response object from express
 * @param data The data we will sent
 * @param error The error message we will sent
 * @param code The error code
 */
export function wrapJSON(res, data?: any, error?: string, code?: number) {
    if (isNone(data)) {
        res.json({error: error || (code === 200 ? "Success" : "Unknown Error"), code: code || 500, success: code === 200});
    } else {
        res.json({data, error: error || (code === 200 ? "Success" : "Unknown Error"), code, success: code === 200});
    }
}
```

The JSDoc explains more about what this code does.

If you want to type `res` parameter so TS knows what it is, do this:
```ts
import { Response } from "express";

/**
 * Wrap our data response in an unified response format
 * @param res Response object from express
 * @param data The data we will sent
 * @param error The error message we will sent
 * @param code The error code
 */
export function wrapJSON(res: Response<any, Record<string, any>>, data?: any, error?: string, code?: number) {
    if (isNone(data)) {
        res.json({error: error || (code === 200 ? "Success" : "Unknown Error"), code: code || 500, success: code === 200});
    } else {
        res.json({data, error: error || (code === 200 ? "Success" : "Unknown Error"), code, success: code === 200});
    }
}
```

#### `src/types.ts`

This file would be our typing stuff that we will reuse sometimes.<br/>
You just need to copy paste this code to the file:
```ts
export interface IPassword {
    id: number;
    email: string;
    password: string;
    lastUpdated: string;
}
```

### `src/index.ts`

This would be our main entrypoint file for our server project.<br/>
**We first need to import some of the packages we will need.**

```ts
import { PrismaClient } from "@prisma/client";
import express from "express";
import session from "express-session";
import path from "path";
import { IPassword } from "./types";

import { wrapJSON } from "./utils";
```

The above would import:
- `PrismaClient` our database connector from Prisma
- `express` the express client itself
- `session` our session handler
- `path` NodeJS pathing packages, useful for ton of stuff
- `IPassword` our defined types from `src/types.ts`
- `wrapJSON` our defined function from `src/utils.ts`

**The second thing we need to do is to initalize our express app and our database client. We also want to define our public folder path.**

```ts
/**
 * Initialize our database and express server
 */
const prisma = new PrismaClient();
const app = express();

// Public file directory
const publicPath = path.join(__dirname, "..", "public");
```
**Explanation!**
- `path.join` will join together a list of parameter that we give together into system friendly path
- `__dirname` is internal variable provided by NodeJS, which tells the current file directory.
- The above `publicPath` would basically means go to the upper directory from `src` folder then `public` directory.


**The next thing we need to do is to set our express server to use JSON data and configure our express session handler.**

```ts
/**
 * Use JSON to process our body input
 */
app.use(express.json());
/**
 * Configure our express-session
 */
const sessConf: session.SessionOptions = {
    // Randomized secret, generated with `openssl rand -hex 32`
    secret: "CHANGETHISTHING",
    saveUninitialized: false,
    resave: false,
    cookie: {},
}

// If the app is running in production mode, enable trust proxy and secure cookies
if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessConf.cookie!.secure = true;
}
// Bind our session
app.use(session(sessConf));
```
**Explanation and Help!**
- `app.use(express.json());` would use JSON as our body input
- `secret: "CHANGETHISTHING",` you need to change this to a proper random secret, you can use `openssl rand -hex 32` or just go to random string generator website
- The `app.get("env") === "production"` if statement is to basically use a more secure version for our session handling.

**After that, we need to create our API Router**

```ts
const apiRouter = express.Router();
```

The above would create a simple router for our API.

**Then, let's create our authenticator system (`/login`, `/signup`, `/logout`)**

```ts
apiRouter.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });
    if (user) {
        // Check password
        if (user.password === password) {
            // @ts-ignore
            req.session!.userId = user.id;
            req.session.save()
            wrapJSON(res, undefined, "Success", 200);
        } else {
            wrapJSON(res.status(401), undefined, "Invalid Password", 401);
        }
    } else {
        wrapJSON(res.status(401), undefined, "Invalid credentials", 401);
    }
})

apiRouter.post("/signup", async (req, res) => {
    const {email, password} = req.body;
    // Check email if it's been used!
    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });
    if (user) {
        wrapJSON(res.status(409), undefined, "User already exists", 409);
    } else {
        const newUser = await prisma.user.create({
            data: {
                email,
                password,
            },
        });
        // @ts-ignore
        req.session!.userId = newUser.id;
        req.session.save()
        wrapJSON(res, undefined, "Success", 200);
    }
})

apiRouter.post("/logout", (req, res) => {
    // Destory our session
    req.session!.destroy(err => {
        if (err) {
            wrapJSON(res.status(500), undefined, "Error", 500);
        } else {
            wrapJSON(res, undefined, "Success", 200);
        }
    }
    );
});
```
**Explanation!**
- `POST /login` route
  1. We first receive our JSON data from user which should contains email and password
  2. Then we check if the email exist or not
  3. If yes, we will then check the password
     1. If correct, set our session to our `userId` and the return success
     2. If wrong, return an invalid password error
  4. If no, return an invalid credentials error
- `POST /signup` route
  1. We first receive our JSON data from user which should contains email and password
  2. Then we check if the email exist or not
  3. If not, we will then proceed creating our new account
  4. If yes, we will return User already exists error
- `POST /logout` route
  1. This route is just a simple session destroyer, after it destory it will just return a success

*Refer more to `wrapJSON` implementation for more info about how I use the function*

**After creating all of our API route, we need to bind our router to the main app**

```ts
// Bind our static folder using express.static so it got served automatically
app.use(express.static(publicPath));
// bind our API router
app.use("/api", apiRouter);
```
**Explanation!**
- The first one would basically server our `publicPath` to the internet
- The second one is to basically bind our `apiRouter` with the base route of `/api`
  - Everything will turn from `/logout` to `/api/logout`

**Then, we can create a custom `/dashboard` route to protect it if user is not logged in**

```ts
// Add our dashboard route
app.get("/dashboard", (req, res) => {
    // Check if the user is logged in
    // @ts-ignore
    if (req.session && req.session.userId) {
        res.sendFile(path.join(publicPath, "dashboard.html"));
    } else {
        res.redirect("/");
    }
})
```

Would basically just check if user has session, if yes send our dashboard view, if not just redirect to login page.

**After that, let's start our database and server**

```ts
// start server and before that connect to database
const port = process.env.PORT || 3000;

/**
 * Connect to our database, after it got established
 * we will then start our server
 */
prisma.$connect().then(() => {
    app.listen(port, () => {
        console.log(`Starting server on http://localhost:${port}`)
    });
}).catch((err) => {
    console.error(err);
    process.exit(1);
})
```
**Explanation!**
- We first setup a port variable which take from our environment table or fallback to port 3000
- Then we first connect to our database, then using JavaScript promise we use the `.then` function to start our server.

**Also, we need to create a custom shutdown handler**

```ts
// Function to stop our server
function shutdownServer() {
    prisma.$disconnect().then(() => {
        process.exit(0);
    }).catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

/**
 * Bind some exit code that we need to listen
 */
const processCallback = ["SIGINT", "SIGTERM", "SIGQUIT", "SIGHUP"];
processCallback.forEach((signal) => {
    process.on(signal, () => {
        console.log(`Received ${signal}`);
        shutdownServer();
    });
});
```
**Explanation!**
- The `shutdownServer` works the same way on connecting, but this time we just call an exit
- The `processCallback` is a list of callback we can use on `process` class or function, we basically want to handle all of those signal to call our custom shudtown function

## Frontend Section

*To be written*

## Package Explanation

*To be written*