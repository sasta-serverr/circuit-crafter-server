const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const app = express();

// Middleware
app.use(cors()); // Allows your HTML frontend to talk to this server
app.use(express.json()); // Allows the server to read the data you send (like total amount)

// 1. Initialize Razorpay (Updated for Render Security)
const razorpay = new Razorpay({
    key_id: 'rzp_live_SJiSy0USTt3wUl', 
    // Uses Render's secure variable, but falls back to your local key for testing
    key_secret: process.env.RAZORPAY_SECRET || 'Ky6cDLjyCw9B4bLuOLu05sVk' 
});

// 2. Route to Create an Order (Frontend calls this first)
app.post('/create-order', async (req, res) => {
    try {
        const { amount } = req.body; 
        const options = {
            amount: amount * 100, // Razorpay works in paise (₹1 = 100 paise)
            currency: "INR",
            receipt: "order_rcptid_" + Math.floor(Math.random() * 1000)
        };
        
        const order = await razorpay.orders.create(options);
        res.json(order); // Sends the secure Order ID back to your website
    } catch (error) {
        console.error("Order Creation Error:", error);
        res.status(500).send("Unable to create order");
    }
});

// 3. Route to Verify Payment (Frontend calls this after customer pays)
app.post('/verify-payment', (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, customerDetails } = req.body;

    // Mathematical security check to prevent payment spoofing
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    
    // Updated to match the secure environment variable logic
    const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET || "Ky6cDLjyCw9B4bLuOLu05sVk") 
        .update(sign.toString())
        .digest("hex");

    if (razorpay_signature === expectedSign) {
        // Formats the terminal output beautifully when an order comes in
        console.log("✅ PAYMENT VERIFIED SUCCESSFULLY!");
        console.log("📦 NEW ORDER DETAILS:");
        console.log(`   👤 Name:  ${customerDetails.name}`);
        console.log(`   📱 Phone: ${customerDetails.phone}`);
        console.log(`   ✉️ Email: ${customerDetails.email}`);
        console.log("--------------------------------------------------");
        
        res.json({ success: true, message: "Payment verified successfully" });
    } else {
        console.log("❌ PAYMENT TAMPERED OR INVALID");
        res.status(400).json({ success: false, message: "Invalid signature" });
    }
});

// Start the server (UPDATED DYNAMIC PORT FOR RENDER)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 CircuitCrafter Backend is active on port ${PORT}`);
});
