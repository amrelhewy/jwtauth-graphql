"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const express_1 = __importDefault(require("express"));
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const userResolver_1 = require("./userResolver");
require("dotenv/config");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const jsonwebtoken_1 = require("jsonwebtoken");
const User_1 = require("./entity/User");
const auth_1 = require("./auth");
const cors_1 = __importDefault(require("cors"));
const sendRefreshToken_1 = require("./sendRefreshToken");
(() => __awaiter(void 0, void 0, void 0, function* () {
    const app = express_1.default();
    app.use(cors_1.default({
        origin: 'http://localhost:3001',
        credentials: true
    }));
    app.use(cookie_parser_1.default());
    app.post('/refresh_token', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const token = req.cookies.jid;
        if (!token) {
            return res.send({ ok: false, accessToken: "" });
        }
        let payload = null;
        try {
            payload = jsonwebtoken_1.verify(token, process.env.REFRESH_TOKEN_SECRET);
        }
        catch (err) {
            return res.send({ ok: false, accessToken: "" });
        }
        const user = yield User_1.User.findOne({ id: payload.userId });
        if (!user) {
            return res.send({ ok: false, accessToken: "" });
        }
        if (user.tokenVersion !== payload.tokenVersion) {
            return res.send({ ok: false, accessToken: "" });
        }
        sendRefreshToken_1.sendRefreshToken(res, auth_1.createRefreshToken(user));
        return res.send({ ok: true, accessToken: auth_1.createAccessToken(user) });
    }));
    yield typeorm_1.createConnection();
    app.listen(4000, () => console.log('server started..'));
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema: yield type_graphql_1.buildSchema({
            resolvers: [userResolver_1.UserResolver]
        }),
        context: ({ res, req }) => ({ res, req })
    });
    apolloServer.applyMiddleware({ app, cors: false });
}))();
//# sourceMappingURL=index.js.map