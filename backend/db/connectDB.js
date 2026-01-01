import mongoose from "mongoose";

const connectDB = async()=>{
    try{
       mongoose.connect(process.env.MONGO_URL);
       console.log("Mongodb connected")
    }
    catch(error) {
        console.log(error);
        process.exit(1);
    }
}

export default connectDB;