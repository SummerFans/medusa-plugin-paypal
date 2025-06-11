module.exports = defineConfig({
  // ...
  modules: [{
    resolve: "@medusajs/medusa/payment",
    options: {
      providers: [
        {
          resolve: "medusa-plugin-paypal/providers/paypal-payment",
          id: "payment-paypal",
          options: {
            intent: process.env.PAYPAL_INTENT, // CAPTURE or AUTHORIZE,
            clientId: process.env.PAYPAL_CLIENT_ID,
            clientSecret: process.env.PAYPAL_CLIENT_SECRET,
            sandbox: process.env.PAYPAL_SANDBOX,
            webhookId: process.env.PAYPAL_WEBHOOK_ID,
            redisUrl: process.env.REDIS_URL,
          },
        }
      ]
    }
  }],
  plugins: [
    {
      resolve: "medusa-plugin-paypal",
      options: {
        intent: process.env.PAYPAL_INTENT, // CAPTURE or AUTHORIZE,
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        sandbox: process.env.PAYPAL_SANDBOX,
        webhookId: process.env.PAYPAL_WEBHOOK_ID,
        redisUrl: process.env.REDIS_URL,
      },
    }
  ]
  //...
})
