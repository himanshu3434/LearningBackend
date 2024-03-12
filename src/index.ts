import * as dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import connectDb from "./db/db.js";

import { app } from "./app.js";

connectDb()
  .then(() => {
    app.on("error", (err) => {
      console.log("error in the express app  : ", err);
      process.exit(1);
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server Started at port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("Failed to Connect to DataBase ", err);
  });
