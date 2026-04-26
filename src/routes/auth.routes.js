const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");

const authController = require("../controller/auth.controller");

router.post("/signup", authController.signup);
router.post("/login", authController.logIn);

router.get("/profile", authMiddleware, authController.profile);

router.get("/refresh-token", authController.refreshToken);

router.post("/logout", authController.logOut);
router.post("/logout-all", authMiddleware, authController.logOutAll);

module.exports = router;
