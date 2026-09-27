import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware";

import { create, getOne, list, remove, update } from "../controllers/expense.controller";

const router = Router();

router.use(authenticate);

router.post("/", create);

router.get("/", list);

router.get("/:id", getOne);

router.put("/:id", update);

router.delete("/:id", remove);

export default router;
