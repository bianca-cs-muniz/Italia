import { Router } from "express";

import LugaresRoutes from "./lugares/lugares.routes";
import FotosRoutes from "./fotos/fotos.routes";
import ChecklistRoutes from "./checklist/checklist.routes";

const router = Router();

router.use("/lugares", LugaresRoutes);
router.use("/fotos", FotosRoutes);
router.use("/checklist", ChecklistRoutes);

export default router;
