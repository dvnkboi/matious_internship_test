
import { Response, Request } from "express";
import { getGrossPerCategory, getSalesPerClientType, getRatingPerSex } from "../../helpers/salesDataHelpers";

const express = require("express");
const router = express.Router();

router.get("/grossPerCategory", async (req: Request, res: Response) => {
  try {
    res.json(await getGrossPerCategory());
  }
  catch (err) {
    res.status(500).send({
      err: err
    });
  }
});

router.get("/salesPerClientType", async (req: Request, res: Response) => {
  try {
    res.json(await getSalesPerClientType());
  }
  catch (err) {
    res.status(500).send({
      err: err
    });
  }
});

router.get("/ratingPerSex", async (req: Request, res: Response) => {
  try {
    res.json(await getRatingPerSex());
  }
  catch (err) {
    res.status(500).send({
      err: err
    });
  }
});

export default router;
export { router };