import {
  Client,
  LogLevel,
  Environment,
  CheckoutPaymentIntent,
  PaymentsController,
  OrdersController,
  Order as PaypalOrder,
  OrderStatus as PaypalOrderStatus,
  PatchOp,
} from "@paypal/paypal-server-sdk";
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  RefundPaymentOutput,
  RefundPaymentInput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  BigNumberRawValue,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  ProviderWebhookPayload,
  WebhookActionResult,
  CancelPaymentInput,
  CancelPaymentOutput,
} from "@medusajs/framework/types";
import { BigNumber } from "bignumber.js";

import {
  AbstractPaymentProvider,
  isDefined,
  MedusaError,
  Module,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils";
import { initiatePaymentData, PayPalOptions, VerifyWebhookSignature } from "./types";
import { Logger } from "@medusajs/medusa";
import getPurchaseUnits from "./utils";

type InjectedDependencies = {
  logger: Logger;
};

class PaypalProviderService extends AbstractPaymentProvider<PayPalOptions> {
  protected paypal_api_: string;
  protected logger_: Logger;
  protected readonly options_: PayPalOptions;
  protected client_: Client;
  protected container_: Record<string, unknown>;
  protected isIntentCaptured: boolean;

  static identifier = "paypal";

  static validateOptions(options: PayPalOptions): void {
    if (!isDefined(options.clientId)) {
      throw new Error("Required option `clientId` is missing in PayPal plugin");
    }
    if (!isDefined(options.clientSecret)) {
      throw new Error(
        "Required option `clientSecret` is missing in PayPal plugin"
      );
    }
    if (!isDefined(options.intent)) {
      throw new Error("Required option `intent` is missing in PayPal plugin");
    }
    if (!isDefined(options.sandbox)) {
      throw new Error("Required option `sandbox` is missing in PayPal plugin");
    }
    if (!isDefined(options.webhookId)) {
      throw new Error(
        "Required option `webhookId` is missing in PayPal plugin"
      );
    }
  }

  public constructor(container: InjectedDependencies, options: PayPalOptions) {
    // @ts-ignore
    super(...arguments);

    this.container_ = container;
    this.options_ = options;
    this.logger_ = this.container_.logger as Logger;

    this.isIntentCaptured = this.options_.intent === "CAPTURE";
    this.paypal_api_ = this.options_.sandbox
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com";

    this.client_ = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: this.options_.clientId,
        oAuthClientSecret: this.options_.clientSecret,
      },
      timeout: this.options_.timeout || 0,
      environment: this.options_.sandbox
        ? Environment.Sandbox
        : Environment.Production,
      logging: {
        logLevel: this.options_.sandbox ? LogLevel.Debug : LogLevel.Warn,
        logRequest: {
          logBody: true,
        },
        logResponse: {
          logHeaders: true,
        },
      },
    });
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    try {
      const statusData = await this.getPaymentStatus(input);

      return statusData;
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Authorize payment failed: ${error.message}`
      );
    }
  }

  async cancelPayment({
    data,
    context,
  }: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return { data };
  }

  async getPaymentStatus(
    paymentData: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const retrievedPayment = await this.retrievePayment(paymentData);
    const paypalOrder = retrievedPayment.data as PaypalOrder;

    switch (paypalOrder.status) {
      case PaypalOrderStatus.Created:
        return {
          status: "pending",
          data: retrievedPayment.data,
        };
      case PaypalOrderStatus.Saved:
      case PaypalOrderStatus.Approved:
      case PaypalOrderStatus.PayerActionRequired:
        return {
          status: "requires_more",
          data: retrievedPayment.data,
        };
      case PaypalOrderStatus.Voided:
        return {
          status: "canceled",
          data: retrievedPayment.data,
        };
      case PaypalOrderStatus.Completed:
        return {
          status: "authorized",
          data: retrievedPayment.data,
        };
      default:
        return {
          status: "pending",
          data: retrievedPayment.data,
        };
    }
  }

  async capturePayment(paymentData: any): Promise<CapturePaymentOutput> {
    const paypalOrder = paymentData.data as PaypalOrder;

    if (
      paypalOrder.purchaseUnits?.length &&
      paypalOrder.purchaseUnits[0].payments
    ) {
      const paymentsController = new PaymentsController(this.client_);
      // Intent Captured
      if (
        this.isIntentCaptured &&
        paypalOrder.purchaseUnits[0].payments.captures?.length
      ) {
        const id = paypalOrder.purchaseUnits[0].payments!.captures[0]
          .id as string;
        try {
          await paymentsController.getCapturedPayment({
            captureId: id,
          });
          return await this.retrievePayment(paymentData);
        } catch (error) {
          this.logger_.error(error);
          throw new Error("An error occurred in capturePayment");
        }
      } else if (
        paypalOrder.purchaseUnits[0].payments!.authorizations?.length
      ) {
        const id = paypalOrder.purchaseUnits[0].payments!.authorizations[0]
          .id as string;
        try {
          await paymentsController.captureAuthorizedPayment({
            authorizationId: id,
          });
          return await this.retrievePayment(paymentData);
        } catch (error) {
          this.logger_.error(error);
          throw new Error("An error occurred in capturePayment");
        }
      } else {
        throw new Error("An error occurred in capturePayment");
      }
    }
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `An error occurred in capturePayment`
    );
  }

  async initiatePayment({
    context,
    data,
    amount,
    currency_code,
  }: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const ordersController = new OrdersController(this.client_);

    try {
      const purchaseUnits = getPurchaseUnits(data as any);

      const { result } = await ordersController.createOrder({
        body: {
          intent: this.isIntentCaptured
            ? CheckoutPaymentIntent.Capture
            : CheckoutPaymentIntent.Authorize,
          ...purchaseUnits,
          purchaseUnits: [
            {
              // referenceId:paymentData?.data?.session_id as string,
              amount: {
                currencyCode: currency_code.toUpperCase(),
                value: amount.toString(),
              },
            },
          ],
        },
      });
      const isPaymentIntent = "id" in result;
      return {
        id: isPaymentIntent
          ? (result.id as string)
          : (paymentData.data?.session_id as string),
        data: {
          ...result,
        },
      };
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Initialize payment failed Error:${error.message}`
      );
    }
  }

  async deletePayment(
    paymentSessionData: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    return paymentSessionData;
  }

  async refundPayment(
    paymentData: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    const paypalOrder = paymentData.data as PaypalOrder;
    if (
      paypalOrder.purchaseUnits?.length &&
      paypalOrder.purchaseUnits[0].payments
    ) {
      const purchaseUnit = paypalOrder.purchaseUnits[0];
      const isAlreadyCaptured = paypalOrder.purchaseUnits.some(
        (pu) => pu.payments?.captures?.length
      );
      if (!isAlreadyCaptured) {
        throw new Error("Cannot refund an uncaptured payment");
      }

      const paymentId = purchaseUnit.payments?.captures![0].id as string;
      const currencyCode = purchaseUnit.amount?.currencyCode as string;
      const paymentsController = new PaymentsController(this.client_);
      try {
        await paymentsController.refundCapturedPayment({
          captureId: paymentId,
          body: {
            amount: {
              currencyCode: currencyCode,
              value: (paymentData.amount as BigNumberRawValue).value.toString(),
            },
          },
        });
        return await this.retrievePayment(paymentData);
      } catch (error) {
        this.logger_.error(error);
        throw new Error("An error occurred in refundPayment");
      }
    }

    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "An error occurred in refundPayment"
    );
  }

  async retrievePayment(
    paymentSessionData: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    try {
      const ordersController = new OrdersController(this.client_);
      const paypalOrderId = paymentSessionData.data!.id as string;
      const { result } = await ordersController.getOrder({
        id: paypalOrderId,
      });
      if (result.id) {
        return {
          data: {
            ...result,
          },
        };
      }
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `An error occurred in retrievePayment Error:${error.message}`
      );
    }
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "An error occurred in retrievePayment"
    );
  }

  async updatePayment(
    context: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    this.logger_.debug(` updatePayment`);

    const ordersController = new OrdersController(this.client_);
    try {
      const paypalOrderId = (context.data!.id as PaypalOrder).id as string;
      await ordersController.patchOrder({
        id: paypalOrderId,
        body: [
          {
            op: PatchOp.Replace,
            value: {
              amount: {
                currencyCode: context.currency_code,
                value: context.amount.toString(),
              },
            },
          },
        ],
      });
      return await this.retrievePayment(context);
    } catch (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `An error occurred in updatePayment Error:${error.message}`
      );
    }
  }

  async getWebhookActionAndData(
    webhookData: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const resource = webhookData?.data.resource as any;

    const verificationResponse = await this.constructWebhookEvent(
      webhookData.data,
      webhookData.headers
    );

    if (verificationResponse.verification_status === "SUCCESS") {
      switch (webhookData.data.event_type) {
        case "CHECKOUT.ORDER.APPROVED":
          return {
            action: PaymentActions.REQUIRES_MORE,
            data: {
              session_id: resource.custom_id as string,
              amount: new BigNumber(resource.amount.value),
            },
          };

        case "PAYMENT.CAPTURE.COMPLETED":
          return {
            action: PaymentActions.SUCCESSFUL,
            data: {
              session_id: resource.custom_id as string,
              amount: new BigNumber(resource.amount.value),
            },
          };
        default:
          return { action: PaymentActions.NOT_SUPPORTED };
      }
    } else {
      this.logger_.warn(`⚠️ Webhook verification failed`);
      return { action: PaymentActions.NOT_SUPPORTED };
    }
  }

  private async constructWebhookEvent(
    data,
    headers: Record<string, unknown>
  ): Promise<VerifyWebhookSignature> {
    const credentials = btoa(
      `${this.options_.clientId}:${this.options_.clientSecret}`
    );
    const res_token = await fetch(`${this.paypal_api_}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials",
    });

    const token = await res_token.json();

    const res = await fetch(
      `${this.paypal_api_}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.access_token}`,
        },
        body: JSON.stringify({
          auth_algo: headers["paypal-auth-algo"],
          cert_url: headers["paypal-cert-url"],
          transmission_id: headers["paypal-transmission-id"],
          transmission_sig: headers["paypal-transmission-sig"],
          transmission_time: headers["paypal-transmission-time"],
          webhook_id: this.options_.webhookId,
          webhook_event: data,
        }),
      }
    );
    return await res.json();
  }
}

export default PaypalProviderService;
