import { Router } from "express";

import { create, getOne, list, remove, update } from "../controllers/budget.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.post("/", create);

router.get("/", list);

router.get("/:id", getOne);

router.put("/:id", update);

router.delete("/:id", remove);

export default router;
