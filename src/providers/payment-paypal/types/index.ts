export interface PayPalOptions {
  sandbox: boolean;
  intent: "CAPTURE" | "AUTHORIZE";
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

export interface initiatePaymentData {
  session_id: string;
  email: string;
  discount_total: number;
  items: {
    thumbnail: string;
    title: string;
    subtitle: string;
    quantity: number;
    unit_price: number;
    tax_total: number;
    sku: string;
    ups:string;
  }[];
  address: {
    address_1: string;
    address_2: string;
    city: string;
    company: string;
    country_code: string;
    first_name: string;
    last_name: string;
    phone: string;
    postal_code: string;
    province: string;
  };
}
