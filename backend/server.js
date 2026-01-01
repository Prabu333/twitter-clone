import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import cloudinary from "cloudinary"
import cors from "cors"

import authRoute from"./routes/auth.route.js"
import connectDB from "./db/connectDB.js";
import userRoute from "./routes/user.route.js"
import postRoute from "./routes/post.route.js"
import notificationRoute from "./routes/notification.route.js"
import messageRoute from"./routes/message.route.js"

dotenv.config();

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});


const app = express();

const PORT = process.env.PORT;

app.use(cors({
    origin:"http://localhost:3000",
    credentials: true
}))

app.use(express.json({
    limit:"5mb"
}))

app.use(cookieParser())

app.use(express.urlencoded({
    extended: true
}))

app.use("/api/auth" , authRoute)
app.use("/api/users" , userRoute)
app.use("/api/post" ,postRoute)
app.use("/api/notifications", notificationRoute);
app.use("/api/message", messageRoute);


app.get("/",(req,res)=>{
    res.send("<h1>Test</h1>")
})

app.listen(PORT,()=>{
    console.log("server running" + PORT)
    connectDB();

})
