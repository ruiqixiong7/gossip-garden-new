import express from "express";
import fs from "fs";

const app = express();
const port = 3000;

//  public 
app.use(express.static("public"));

//  API return to dataset.json
app.get("/api/dataset", (req, res) => {
  const raw = fs.readFileSync("./data/dataset.json");
  res.type("json").send(raw);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});