import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json({
    limit: "25mb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "25mb"
}));
const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

app.get("/", (req, res) => {
    res.send("Frame Capture backend is running!");
});

app.post("/api/send-frame", async (req, res) => {
    console.log("POST /api/send-frame received");

    try {
        const { email, image } = req.body;

        console.log("Email:", email);
        console.log("Has image:", !!image);

        // email sending code...

        res.json({
            success: true
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to send email"
        });
    }
});

app.get("/api/test-email", async (req, res) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,

            subject: "Frame Capture Test",

            text: "It works! The Frame Capture backend can send emails."
        });

        res.json({
            success: true,
            message: "Test email sent!"
        });

    } catch (error) {
        console.error("EMAIL ERROR:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.listen(5001, () => {
    console.log(
        "Backend running on http://localhost:5001"
    );
});