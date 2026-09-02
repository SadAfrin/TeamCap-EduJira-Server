import { Router } from "express";
import {
  getAllParents,
  getParentById,
  createParent,
  updateParent,
  deleteParent,
  linkChildToParent,
} from "../controllers/parent.controller";

const router = Router();

router.get("/", getAllParents);
router.get("/:id", getParentById);
router.post("/", createParent);
router.put("/:id", updateParent);
router.delete("/:id", deleteParent);
router.post("/:id/link-child", linkChildToParent);

export default router;
