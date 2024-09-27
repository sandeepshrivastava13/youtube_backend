import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is up and running at ${process.env.PORT}`);
    });
  })
  .catch((err) => console.log("MONGODB Connection failed!!", err));

/*
const app = express();

(async function () {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", () => {
      console.log("ERROR: Not avail to talk");
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log(`App is listening on port ${process.env.port}`);
    });
  } catch (err) {
    console.log("Error", err);
  }
})();
*/
