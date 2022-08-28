import { PrismaClient } from "@prisma/client";
import express from "express";
import session from "express-session";
import path from "path";
import { IPassword } from "./types";

import { wrapJSON } from "./utils";

/**
 * Initialize our database and express server
 */
const prisma = new PrismaClient();
const app = express();

// Public file directory
const publicPath = path.join(__dirname, "..", "public");

/**
 * Use JSON to process our body input
 */
app.use(express.json());
/**
 * Configure our express-session
 */
const sessConf: session.SessionOptions = {
    // Randomized secret, generated with `openssl rand -hex 32`
    secret: "d1e6fc64bb0afcc76938f3f0562ea888cec64c40e384110dbdfe3b677752abfd",
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

// API routes
const apiRouter = express.Router();

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

apiRouter.get("/passwords", async (req, res) => {
    // @ts-ignore
    const {userId} = req.session!;
    if (!userId) {
        wrapJSON(res.status(403), undefined, "Unathorized", 403);
    } else {
        // Get all passwords related to our user id
        const passwords = await prisma.passwordBank.findMany({
            where: {
                userId,
            }
        })
        // Remap our password results
        const remappedPassword: IPassword[] = passwords.map((passwd) => {
            return {
                id: passwd.id,
                email: passwd.email,
                password: passwd.password,
                lastUpdated: passwd.lastUpdated.toISOString(),
            }
        })
        wrapJSON(res, remappedPassword, undefined, 200);
    }
})

apiRouter.post("/passwords", async (req, res) => {
    // @ts-ignore
    const {userId} = req.session!;
    if (!userId) {
        wrapJSON(res.status(403), undefined, "Unathorized", 403);
    } else {
        const {email, password} = req.body;
        const newPasswd = await prisma.passwordBank.create({
            data: {
                email,
                password,
                userId,
            }
        })
        wrapJSON(res, {
            id: newPasswd.id,
            email: newPasswd.email,
            password: newPasswd.password,
            lastUpdated: newPasswd.lastUpdated.toISOString(),
        } as IPassword, undefined, 200);
    }
})

apiRouter.put("/passwords", async (req, res) => {
    // @ts-ignore
    const {userId} = req.session!;
    if (!userId) {
        wrapJSON(res.status(403), undefined, "Unathorized", 403);
    } else {
        const {email, password, id} = req.body;
        const updatedPasswd = await prisma.passwordBank.update({
            where: {
                id,
            },
            data: {
                email,
                password,
                lastUpdated: new Date(),
            }
        })
        wrapJSON(res, {
            id: updatedPasswd.id,
            email: updatedPasswd.email,
            password: updatedPasswd.password,
            lastUpdated: updatedPasswd.lastUpdated.toISOString(),
        } as IPassword, undefined, 200);
    }
})

apiRouter.delete("/passwords", async (req, res) => {
    // @ts-ignore
    const {userId} = req.session!;
    if (!userId) {
        wrapJSON(res.status(403), undefined, "Unathorized", 403);
    } else {
        const {id} = req.body;
        await prisma.passwordBank.delete({
            where: {
                id,
            },
        });
        wrapJSON(res, undefined, undefined, 200);
    }
})


// Bind our static folder using express.static so it got served automatically
app.use(express.static(publicPath));
// bind our API router
app.use("/api", apiRouter);

// Add custom register route
app.get("/register", (req, res) => {
    res.sendFile(path.join(publicPath, "register.html"));
})

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
