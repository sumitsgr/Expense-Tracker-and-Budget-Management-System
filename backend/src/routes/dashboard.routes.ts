import { Router } from "express";

import { get } from "../controllers/dashboard.controller";

import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", get);

export default router;
