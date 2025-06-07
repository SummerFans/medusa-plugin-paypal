
export interface PayPalOptions {
  sandbox: boolean;
  intent: "CAPTURE"|"AUTHORIZE", 
  clientId: string;
  clientSecret: string;
  timeout?: number;
  webhookId: string;
  redisUrl: string;
  redisOptions?: Record<string, any>;
}

export interface VerifyWebhookSignature {
  verification_status: "SUCCESS" | "FAILURE";
}
