import { Router, type IRouter } from "express";
import healthRouter from "./health";
import financeRouter from "./finance";
import kitchenRouter from "./kitchen";
import kitchenAdviceRouter from "./kitchen-advice";

const router: IRouter = Router();

router.use(healthRouter);
router.use(financeRouter);
router.use(kitchenRouter);
router.use(kitchenAdviceRouter);

export default router;
