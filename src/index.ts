import { PrismaClient } from "@prisma/client";
import express from "express";
import session from "express-session";
import path from "path";

import { wrapJSON } from "./utils";

const prisma = new PrismaClient();
const app = express();

// current file dir
const publicPath = path.join(__dirname, "..", "public");

app.use(express.json());
const sessConf: session.SessionOptions = {
    secret: "d1e6fc64bb0afcc76938f3f0562ea888cec64c40e384110dbdfe3b677752abfd",
    cookie: {},
}

if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessConf.cookie!.secure = true;
}
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
    if (user && user.password === password) {
        // @ts-ignore
        req.session!.userId = user.id;
        req.session.save()
        wrapJSON(res, undefined, "Success", 200);
    } else {
        wrapJSON(res.status(401), undefined, "Invalid credentials", 401);
    }
})

apiRouter.post("/signup", async (req, res) => {
    const {email, password} = req.body;
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
        const passwords = await prisma.passwordBank.findMany({
            where: {
                userId,
            }
        })
        const remappedPassword = passwords.map((passwd) => {
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
        }, undefined, 200);
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
        }, undefined, 200);
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


// static serve
app.use(express.static(publicPath));
// bind API
app.use("/api", apiRouter);

app.get("/register", (req, res) => {
    res.sendFile(path.join(publicPath, "register.html"));
})

app.get("/dashboard", (req, res) => {
    // @ts-ignore
    if (req.session && req.session.userId) {
        res.sendFile(path.join(publicPath, "dashboard.html"));
    } else {
        res.redirect("/");
    }
})

// start server and before that connect to database
const port = process.env.PORT || 3000;

prisma.$connect().then(() => {
    app.listen(port, () => {
        console.log(`Starting server on http://localhost:${port}`)
    });
}).catch((err) => {
    console.error(err);
    process.exit(1);
})

function shutdownServer() {
    prisma.$disconnect().then(() => {
        process.exit(0);
    }).catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

const processCallback = ["SIGINT", "SIGTERM", "SIGQUIT", "SIGHUP"];
processCallback.forEach((signal) => {
    process.on(signal, () => {
        console.log(`Received ${signal}`);
        shutdownServer();
    });
});
