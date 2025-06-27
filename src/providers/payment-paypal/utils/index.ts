import {
  AmountBreakdown,
  AmountWithBreakdown,
  Item,
  ItemCategory,
  Money,
  PurchaseUnit,
  PurchaseUnitRequest,
  ShippingDetails,
  ShippingWithTrackingDetails,
} from "@paypal/paypal-server-sdk";
import { BigNumberInput } from '@medusajs/framework/types';
import { BigNumber } from '@medusajs/framework/utils';


function normalizePayPalMoney(currency: string, amount: BigNumberInput): Money {
  const currencyDecimalMap = {
    AUD: 2, BRL: 2, CAD: 2, CNY: 2, CZK: 2, USD: 2, THB: 2,
    CHF: 2, SEK: 2, SGD: 2, GBP: 2, PLN: 2, PHP: 2, NOK: 2,
    NZD: 2, TWD: 2, MXN: 2, MYR: 2, ILS: 2, HUF: 2, HKD: 2,
    EUR: 2, DKK: 2, JPY: 0,
  };
  let currencyCode = (currency || "").toUpperCase();
  const precision = currencyDecimalMap[currencyCode] ?? 2;

  const value = new BigNumber(amount).numeric.toFixed(precision).replace('.00', '');

  return {
    currencyCode,
    value,
  };
}

const getPurchaseUnits = (
  extra: Record<string, unknown>
): { purchaseUnits: PurchaseUnitRequest[] } => {

  let purchaseUnit: PurchaseUnitRequest = {
    customId: extra.session_id as string,
    amount: { currencyCode: '', value: '' }
  };
  let breakdown: AmountBreakdown = {};
  let shipping: ShippingDetails = {};

  if (extra?.address) {
    shipping.name = {
      fullName: extra?.fullName as string,
    }
    shipping.emailAddress = extra?.emailAddress as string;
    shipping.address = extra?.address as any
    purchaseUnit.shipping = shipping
  }
  if (extra?.shippingTotal) {
    breakdown.shipping = normalizePayPalMoney(extra?.currency_code as string, extra?.shippingTotal as BigNumberInput)
  }

  if (extra?.discount) {
    breakdown.discount = normalizePayPalMoney(extra?.currency_code as string, extra?.discount as BigNumberInput)
  }

  if (extra?.taxTotal) {
    breakdown.taxTotal = normalizePayPalMoney(extra?.currency_code as string, extra?.taxTotal as BigNumberInput)
  }

  if (extra?.itemTotal) {
    breakdown.itemTotal = normalizePayPalMoney(extra?.currency_code as string, extra?.itemTotal as BigNumberInput)
  }

  if (extra.items && (extra.items as []).length > 0) {
    const items: Item[] = [];
    (extra.items as []).map((item: any) => {
      items.push({
        name: item.name,
        description: item?.description,
        unitAmount: normalizePayPalMoney(extra?.currency_code as string, item.unitAmount as BigNumberInput),
        quantity: item.quantity.toString(),
        imageUrl: item.imageUrl,
        sku: item?.sku,
        // ...
      })
    })

    purchaseUnit.amount = {
      currencyCode: (extra?.currency_code as string).toUpperCase(),
      value: normalizePayPalMoney(extra?.currency_code as string, extra?.amount as BigNumberInput).value,
      breakdown,
    }
    purchaseUnit.items = items
  } else {
    purchaseUnit.amount = {
      currencyCode: (extra?.currency_code as string).toUpperCase(),
      value: normalizePayPalMoney(extra?.currency_code as string, extra?.amount as BigNumberInput).value,
      breakdown
    };
  }

  return {
    purchaseUnits: [purchaseUnit],
  };
};

export {
  getPurchaseUnits,
  normalizePayPalMoney
};
