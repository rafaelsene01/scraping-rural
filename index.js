import "dotenv/config";
import express from "express";
import Car from "./car.js";

const app = express();

const car = new Car();

app.use(express.json());
app.get("/:taxId", async function (req, res) {
  const { taxId } = req.params;
  res.send(await car.search(taxId));
});

app.listen(3000, () => console.log("http://localhost:3000"));
