import dotenv from "dotenv";
import connectDb from "./db/db.js";
import { port } from "./constants.js";
import { app } from "./app.js";
import debugLib from "debug";
dotenv.config({ path: "./env" });

const debug = debugLib("development:index.js");

async function main() {
  await connectDb();

  app.listen(port, () => {
    console.log(`Server is listening at port http://localhost:${port}`);
  });
}

main();
