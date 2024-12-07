const express = require("express");
// Express routing component
const router = express.Router();
const userController = require("../controllers/User-Controllers.js");
const { verify } = require("../auth.js");

// User Registration
router.post("/register", userController.registerUser);


router.post("/all", userController.getAllUsers)

// User Login
router.post("/login", userController.loginUser);

// Check if email exists
router.post("/check-email", userController.checkEmail);

// Get user details
router.post("/details", verify, userController.getProfile);

// Get user details
router.post("/enroll", verify, userController.enroll);

router.put("/update", verify, userController.updateProfile);

router.put("/update-user", verify, userController.updateUser);



module.exports = router;