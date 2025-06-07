import { AdminOrder } from "@medusajs/framework/types";

function getPayPalPayment(order: AdminOrder) {
  if (order.payment_collections && order.payment_collections.length > 0) {
    const paymentCollection = order.payment_collections[0];

    if (paymentCollection.payments && paymentCollection.payments.length > 0) {
      const payment = paymentCollection.payments[0];

      return payment.provider_id === "pp_paypal" ? payment : null;
    }
  }

  return null;
}

function getPaypalPaymentId(payment: any) {
  let intent = "captures";
  switch (payment.data.intent) {
    case "capture":
      intent = "captures";
      break;
    case "authorize":
      intent = "authorizations";
      break;
    case "refund":
      intent = "refunds";
      break;
  }

  if (payment.data?.purchaseUnits && payment.data.purchaseUnits.length > 0) {
    if (
      payment.data.purchaseUnits[0].payments[intent] &&
      payment.data.purchaseUnits[0].payments[intent].length > 0
    )
      return payment.data.purchaseUnits[0].payments[intent][0].id;
  }
}

function getPaypalDetailUrl(payment: any): string {
  let isSandbox = false;

  if (payment.data?.links && payment.data.links.length > 0) {
    isSandbox = payment.data.links.some((link: any) =>
      link.href.includes("sandbox")
    );
  }

  if (isSandbox) {
    return `https://www.sandbox.paypal.com/activity/payment/${getPaypalPaymentId(
      payment
    )}`;
  }
  return `https://www.paypal.com/activity/payment/${getPaypalPaymentId(
    payment
  )}`;
}

export { getPayPalPayment, getPaypalPaymentId, getPaypalDetailUrl };
