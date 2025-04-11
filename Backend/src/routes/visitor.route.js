const VisitorController= require("../controller/visitor.controller");
const { auth, IsSecurity } = require("../middleware/auth");
const router=require("express").Router()
//add visitor
router.post("/addvisitor",auth,IsSecurity,VisitorController.CreateVisitor)
//get visitor
router.get("/viewvisitor",auth,VisitorController.GetAllVisitor)

//filter data
router.get("/filter",auth,IsSecurity,VisitorController.FilterVisitor)
module.exports=router;