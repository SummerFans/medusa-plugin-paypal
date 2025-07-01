import { Logger } from "@medusajs/medusa";
import { PayPalOptions } from "../../../providers/payment-paypal/types";

class HttpClient {
  protected _opiton: PayPalOptions;
  protected _baseUrl: string;
  protected defaultHeaders: any;
  protected _logger: Logger;

  constructor(options: PayPalOptions, logger: Logger) {
    if (!options.clientId) {
      throw new Error("Required option `clientId` is missing in PayPal plugin");
    }
    if (!options.clientSecret) {
      throw new Error(
        "Required option `clientSecret` is missing in PayPal plugin"
      );
    }
    if (options.sandbox == undefined) {
      throw new Error("Required option `sandbox` is missing in PayPal plugin");
    }

    this._opiton = options;
    this._logger = logger;
    this._baseUrl = this._opiton.sandbox
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com";
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  async request(
    endpoint,
    { method = "GET", body = null, headers = {} }: any = {}
  ) {
    const url = this._baseUrl + endpoint;
    const config: any = {
      method,
      headers: {...this.defaultHeaders,...headers}
    };

    if (typeof body === "string") {
      config.body = body;
    } else if (body !== null && typeof body === "object") {
      config.body = JSON.stringify(body);
    }
    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw {
          message: data?.message || response.statusText || "HTTP error",
          status: response.status,
          data,
        };
      }

      return data;
    } catch (error) {
      this._logger.error(error.message);
      if (error instanceof TypeError) {
        // 网络错误
        throw { message: "Network error", error };
      }

      throw error;
    }
  }
}

export default HttpClient;
