
import dotenv from "dotenv"
import { app } from "./app.js";
import connectDB from "./db/index.js";
dotenv.config({
    path: "./.env"
})

const PORT = process.env.PORT || 8001;
console.log("port is running on ",PORT);

// Fail fast if required env vars are missing
if (!process.env.MONGODB_URI) {
    console.error("Missing MONGODB_URI in .env. Check dotenv path and variable name.");
    process.exit(1);
}

connectDB()
.then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    })
})
.catch((err) => {
    console.error("DB connection error:", err?.message);
})