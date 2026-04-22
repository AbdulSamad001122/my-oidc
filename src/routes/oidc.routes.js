import { Router } from "express";
import {
  getOpenIdConfiguration,
  getJwks,
  getAuthenticatePage,
  signIn,
  signUp,
  getUserInfo,
} from "../controllers/oidc.controller.js";

const router = Router();

// .well-known endpoints
router.get("/.well-known/openid-configuration", getOpenIdConfiguration);
router.get("/.well-known/jwks.json", getJwks);

// Authentication endpoints
router.get("/o/authenticate", getAuthenticatePage);
router.post("/o/authenticate/sign-in", signIn);
router.post("/o/authenticate/sign-up", signUp);

// User info endpoint
router.get("/o/userinfo", getUserInfo);

export default router;
