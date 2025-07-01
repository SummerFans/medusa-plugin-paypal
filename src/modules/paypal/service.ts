import { MedusaService } from "@medusajs/framework/utils";
import { Logger } from "@medusajs/medusa";
import { PayPalOptions } from "../../providers/payment-paypal/types";
import HttpClient from "./utils/httpClient";

type InjectedDependencies = {
  logger: Logger;
};

class PaypalModuleService extends MedusaService({}) {
  protected _logger: Logger;
  protected _options: PayPalOptions;
  protected _httpClient: HttpClient;

  constructor(container: InjectedDependencies, options: PayPalOptions) {
    super(...arguments);

    this._options = options;
    this._logger = container.logger;

    this._httpClient = new HttpClient(this._options, this._logger);
  }

  async getToken(): Promise<{ access_token: string, expires_in: number }> {
    const credentials = btoa(
      `${this._options.clientId}:${this._options.clientSecret}`
    );
    const { access_token, expires_in } = await this._httpClient.request(
      `/v1/oauth2/token`,
      {
        method: 'POST',
        body: "grant_type=client_credentials",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${credentials}`
        }
      }
    );

    return { access_token, expires_in }
  }

  async getOrder({ orderId, token }: { orderId: string, token: string }): Promise<any> {
    const order = await this._httpClient.request(
      `/v2/checkout/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    return order;
  }
}

export default PaypalModuleService;


declare module "@medusajs/framework/types" {
  export interface ModuleImplementations {
    paypalModuleService: PaypalModuleService;
  }
} 