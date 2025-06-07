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

  constructor(container: InjectedDependencies, options:PayPalOptions) {
    super(...arguments);


    this._options = options;
    this._logger = container.logger;

    this._httpClient = new HttpClient(this._options ,this._logger);
  }

  async getOrder(orderId: string): Promise<any> {
    const order = await this._httpClient.request(
      `/v2/checkout/orders/${orderId}`
    );

    return order;
  }
}

export default PaypalModuleService;
