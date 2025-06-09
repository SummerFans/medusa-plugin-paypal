import {
  PurchaseUnit,
  ShippingWithTrackingDetails,
} from "@paypal/paypal-server-sdk";
import { initiatePaymentData } from "../types";

const getPurchaseUnits = (
  extra: Record<string, unknown>
): { purchaseUnits: PurchaseUnit[] } => {

  // if (!extra.items) {
  //   purchaseUnit = {
  //     amount: { currencyCode: currencyCode, value: amount },
  //   } as Partial<PurchaseUnit>;
  // } else if (extra.items && (extra.items as [])?.length > 0) {
  //   let amountData: any = {
  //     currencyCode: currencyCode,
  //     value: amount,
  //     breakdown: {},
  //   };

  //   // discount
  //   if (extra.discount_total) {
  //     amountData.breakdown = {
  //       discount: extra.discount_total,
  //     };
  //   }

  //   purchaseUnit = {
  //     amount: amountData,
  //   } as Partial<PurchaseUnit>;
  // }

  // if (data && data?.address) {
  //   purchaseUnit.shipping = {
  //     emailAddress: data.email,
  //     name: {
  //       fullName: `${data.address.first_name} ${data.address.last_name}`,
  //     },
  //     address: {
  //       addressLine1: data?.address.address_1,
  //       addressLine2: data?.address.address_2,
  //       countryCode: data.address.country_code.toUpperCase(),
  //       postalCode: data.address.postal_code,
  //       adminArea1: data.address.province,
  //     },
  //   };
  // }

  return {
    purchaseUnits: [purchaseUnit],
  };
};

export default getPurchaseUnits;
