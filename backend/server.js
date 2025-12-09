/**
 * BACKEND SERVER (Node.js)
 * 
 * This file is intended to be deployed to a server environment (e.g., Heroku, Render, AWS, Google Cloud).
 * It CANNOT run inside the browser.
 * 
 * Purpose:
 * 1. Listen for Webhook events from Square (Notification URL).
 * 2. Verify the security signature to ensure the request is actually from Square.
 * 3. Update a real database (like Firebase, Supabase, or MongoDB) when payment is confirmed.
 */

const express = require('express');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

// Square requires the raw body for signature verification
app.use(express.text({ type: 'application/json' }));

/**
 * CONFIGURATION
 * These should be set in your server's Environment Variables
 */
const SIGNATURE_KEY = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY; // Found in Square Dashboard
const NOTIFICATION_URL = process.env.SQUARE_NOTIFICATION_URL; // e.g., 'https://your-api.com/api/square/webhook'

/**
 * Verify that the request actually came from Square
 */
const isFromSquare = (signature, body) => {
  if (!SIGNATURE_KEY) {
      console.warn("WARNING: No Signature Key configured. Skipping verification.");
      return true;
  }
  const hmac = crypto.createHmac('sha1', SIGNATURE_KEY);
  hmac.update(NOTIFICATION_URL + body);
  const hash = hmac.digest('base64');
  return hash === signature;
};

/**
 * THE NOTIFICATION URL ROUTE
 * Paste this full URL into Square: https://[YOUR_DOMAIN]/api/square/webhook
 */
app.post('/api/square/webhook', (req, res) => {
  const signature = req.headers['x-square-hmacsha1-signature'];
  const body = req.body; 

  // 1. Verify Security
  if (!isFromSquare(signature, body)) {
    console.error('⛔ Signature verification failed. Potential attack.');
    return res.status(403).send('Forbidden');
  }

  // 2. Parse Data
  let event;
  try {
    event = JSON.parse(body);
  } catch (err) {
    return res.status(400).send('Invalid JSON');
  }

  // 3. Log Event
  console.log('Received Square Event:', event.type);

  // 4. Handle Specific Payment Events
  if (event.type === 'payment.updated') {
     const payment = event.data.object.payment;
     
     if (payment.status === 'COMPLETED') {
         console.log(`✅ Payment Successful! Transaction ID: ${payment.id}`);
         console.log(`💰 Amount: ${payment.amount_money.amount} ${payment.amount_money.currency}`);
         
         // TODO: CONNECT A DATABASE HERE
         // Since your frontend uses localStorage, a real backend needs a real database 
         // to store the "Pro" status so the user can log in from any device.
         // Example: 
         // await database.users.update(
         //    { customerEmail: payment.buyer_email_address }, 
         //    { isPro: true }
         // );
     }
  }

  // 5. Respond to Square (Must return 200 OK)
  res.status(200).send('OK');
});

// Health Check
app.get('/', (req, res) => {
    res.send('Shoot.Edit.Release Backend is Active.');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});