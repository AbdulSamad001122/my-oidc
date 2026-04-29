import { Router } from "express";
import { signIn, signUp, getUserInfo, devLogin, devLogout, getSession, getDevSession } from "../controllers/auth.controller.js";
import { createClient, getClients, deleteClient, getClientPage } from "../controllers/client.controller.js";
import { getOpenIdConfiguration, getJwks, getAuthenticatePage, getDocsPage, getAuthorizePage, authorize, consent, token } from "../controllers/oauth.controller.js";

const router = Router();

router.get("/.well-known/openid-configuration", getOpenIdConfiguration);
router.get("/.well-known/jwks.json", getJwks);

router.get("/docs", getDocsPage);

router.get("/o/authenticate", getAuthenticatePage);
router.post("/o/authenticate/sign-in", signIn);
router.post("/o/authenticate/sign-up", signUp);

router.get("/clients/new", getClientPage);
router.post("/clients", createClient);
router.get("/clients", getClients);
router.delete("/clients/:id", deleteClient);

router.post("/dev-login", devLogin);
router.post("/dev-logout", devLogout);
router.get("/o/session", getSession);
router.get("/dev-session", getDevSession);

router.get("/o/authorize", getAuthorizePage);
router.post("/o/authorize", authorize);
router.post("/o/consent", consent);
router.post("/o/token", token);

router.get("/o/userinfo", getUserInfo);

export default router;
