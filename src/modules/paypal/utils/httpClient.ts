import { Logger } from "@medusajs/medusa";
import { PayPalOptions } from "../../../providers/payment-paypal/types";
import Redis from "ioredis";

class HttpClient {
  protected _opiton: PayPalOptions;
  protected _baseUrl: string;
  protected defaultHeaders: any;
  protected _logger: Logger;
  protected _paypalCacheKey = "PAYPAL_TOKEN";
  protected _cacheRedis: Redis;

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

    if (!options.redisUrl) {
      throw new Error("Required option `redisUrl` is missing in PayPal plugin");
    }

    this._opiton = options;
    this._logger = logger;
    this._baseUrl = this._opiton.sandbox
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com";
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    this._cacheRedis = new Redis(options.redisUrl, {
      // Lazy connect to properly handle connection errors
      lazyConnect: true,
      ...(options?.redisOptions ?? {}),
    });
  }

  private async getToken(): Promise<string> {
    const accessToken = (await this._cacheRedis.get(
      this._paypalCacheKey
    )) as string;

    if (!accessToken) {
      const credentials = btoa(
        `${this._opiton.clientId}:${this._opiton.clientSecret}`
      );
      const { access_token, expires_in } = await this.request(
        "/v1/oauth2/token",
        {
          method: "POST",
          body: "grant_type=client_credentials",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      await this._cacheRedis.set(
        this._paypalCacheKey,
        access_token,
        "EX",
        expires_in
      );
      this._logger.debug(
        `PayPal access token cached for ${expires_in} seconds`
      );
      return access_token;
    }

    this._logger.debug("Using cached PayPal access token");
    return accessToken;
  }

  async buildHeaders(customHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...customHeaders };
    if (!headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${await this.getToken()}`;
    }

    return headers;
  }

  async request(
    endpoint,
    { method = "GET", body = null, headers = {} }: any = {}
  ) {
    const url = this._baseUrl + endpoint;

    const config: any = {
      method,
      headers: await this.buildHeaders(headers),
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
