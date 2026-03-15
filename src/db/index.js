import mongoose from "mongoose";
 import { DB_NAME } from "../constants.js";//if u want ur databse name to be dynamic then use env variable instead of constant

 const connectDB =async()=>{
    try {
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        console.log("Mongodb connected!");
        
    } catch (error) {
        console.error("MongoDB connection error:", error?.message);
        process.exit(1);//means exit with failure code
    }
 }

 export default connectDB;