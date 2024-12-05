const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Constants
const PORT = process.env.PORT || 5000;
const CURRENCY = { USD: 'usd' };

// Utility: Error handler middleware
function errorHandler(err, req, res, next) {
    console.error('Unhandled error:', err.message || err);
    res.status(err.status || 500).json({
        error: true,
        message: err.message || 'Internal Server Error',
    });
}

// API Endpoint: Create Payment Intent
app.post('/create-payment-intent', async (req, res, next) => {
    try {
        const { amount } = req.body;

        // Input validation
        if (!amount) {
            return res.status(400).json({
                error: true,
                message: 'Amount is required.',
            });
        }

        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({
                error: true,
                message: 'Invalid amount. It must be a positive number.',
            });
        }

        // Create Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: CURRENCY.USD,
            automatic_payment_methods: { enabled: true },
        });

        // Send response
        res.status(200).json({
            success: true,
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        if (error.type === 'StripeCardError') {
            return res.status(400).json({
                error: true,
                message: error.message,
            });
        }
        next(error);
    }
});

app.use((req, res, next) => {
    res.status(404).json({
        error: true,
        message: 'Resource not found.',
    });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
