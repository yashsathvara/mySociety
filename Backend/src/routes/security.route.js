const SecurityController = require("../controller/security.controller");
const { auth, IsAdmin } = require("../middleware/auth");
const upload = require("../utils/Owner.images");
const router = require("express").Router();
//add protocol
router.post("/addprotocol",auth,IsAdmin, SecurityController.CreateProtocol);
//get protocol
router.get("/getprotocol", SecurityController.GetAllProtocol);
//get by id protocol
router.get("/getprotocol/:id", SecurityController.GetByIdProtocol);
//delete protocol
router.delete("/protocol/:id", auth,IsAdmin,SecurityController.DeleteProtocol);
//update protocol
router.patch("/protocol/:id",auth,IsAdmin, SecurityController.UpdateProtocol);

//add security Guard
router.post(
  "/addsecurity",auth,IsAdmin,
  upload.fields([
    { name: "profileimage", maxCount: 1 },
    { name: "adhar_card", maxCount: 1 },
  ]),
  SecurityController.CreateSecurityGuard
);
//get Guard
router.get("/viewguard", SecurityController.GetSecurityGuard);
//get by id Guard
router.get("/guard/:id", SecurityController.GetByIdGuard);
//delete Guard
router.delete("/guard/:id",auth,IsAdmin, SecurityController.DeleteGuard);
//update Guard
router.patch(
  "/guard/:id",auth,IsAdmin,
  upload.fields([
    { name: "profileimage", maxCount: 1 },
    { name: "adhar_card", maxCount: 1 },
  ]),
  SecurityController.updateSecurityGuard
);
module.exports = router;
