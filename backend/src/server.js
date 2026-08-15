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

transporter.verify((error, success) => {
    if (error) {
        console.error("SMTP CONNECTION ERROR:", error);
    } else {
        console.log("SMTP server is ready");
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

        if (!email || !image) {
            return res.status(400).json({
                success: false,
                error: "Email and image are required."
            });
        }

        const base64Image = image.replace(
            /^data:image\/png;base64,/,
            ""
        );

        console.log("About to send email...");

        const info = await transporter.sendMail({
            from: `"AFH Frame Capture" <${process.env.EMAIL_USER}>`,
            to: email,

            subject: "Frame Capture from AFH Summer Show",

            html: `
                <div
                    style="
                        font-family: Arial, sans-serif;
                        background: #111;
                        color: white;
                        padding: 32px;
                        text-align: center;
                    "
                >
                    <h1
                        style="
                            margin-bottom: 8px;
                            font-size: 32px;
                        "
                    >
                        AFH Frame Capture
                    </h1>

                    <p
                        style="
                            color: #cccccc;
                            font-size: 16px;
                            margin-bottom: 28px;
                        "
                    >
                        Thanks for visiting the AFH Summer Show.
                    </p>

                    <div
                        style="
                            background: #1f1f1f;
                            padding: 20px;
                            border-radius: 16px;
                            max-width: 600px;
                            margin: 0 auto;
                        "
                    >
                        <img
                            src="cid:frameCapture"
                            alt="Your AFH Frame Capture"
                            style="
                                width: 100%;
                                border-radius: 10px;
                                display: block;
                            "
                        >

                        <p
                            style="
                                margin-top: 20px;
                                color: #eeeeee;
                            "
                        >
                            Here is your captured frame from the show.
                        </p>
                    </div>

                    <p
                        style="
                            margin-top: 30px;
                            font-size: 12px;
                            color: #777777;
                        "
                    >
                        AFH Summer Show • Frame Capture Interactive Installation
                    </p>
                </div>
            `,

            attachments: [
                {
                    filename: "AFH-Summer-Show-Frame.png",
                    content: base64Image,
                    encoding: "base64",

                    // Lets us display the attachment
                    // inside the HTML email too
                    cid: "frameCapture"
                }
            ]
        });

        console.log("EMAIL SENT");
        console.log("MESSAGE ID:", info.messageId);
        console.log("ACCEPTED:", info.accepted);
        console.log("REJECTED:", info.rejected);
        console.log("RESPONSE:", info.response);

        res.json({
            success: true,
            message: "Frame sent successfully.",
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected
        });

    } catch (error) {
        console.error("EMAIL ERROR:", error);

        res.status(500).json({
            success: false,
            error: error.message
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