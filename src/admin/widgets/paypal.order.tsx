import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Container, Heading, IconButton } from "@medusajs/ui";
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types";
import { getPayPalPayment, getPaypalPaymentId, getPaypalDetailUrl } from "../utils";
import { ArrowUpRightOnBox, Spinner } from "@medusajs/icons";
import { useEffect, useState } from "react";
import { Badge, Text } from "@medusajs/ui";

declare const __BACKEND_URL__: string;

const OrderDetailWidget = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  const paypalPayment = getPayPalPayment(order);
  if (!paypalPayment) {
    return "";
  }

  const [payment, setPayment] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const paypalOrderId = paypalPayment?.data?.id as string;

  const id = getPaypalPaymentId(paypalPayment);

  const paypalDetailUrl = getPaypalDetailUrl(paypalPayment);

  useEffect(() => {
    if (!loading) return;
    fetch(`${__BACKEND_URL__ || ''}/admin/plugin/paypal/orders/${paypalOrderId}`, {
      method: "GET",
      credentials: 'include'
    })
      .then((res) => res.json())
      .then((data) => {
        setPayment(data);
        setLoading(false);
      });
  }, [loading]);
  return (
    <div>
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading className="w-100" level="h2">
            Paypal
          </Heading>
        </div>
        <div>
          {loading || !payment ? (
            <div className="flex justify-center items-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="w-full grid grid-cols-4 sm:grid-cols-2 gap-4 p-4">
              <div>
                <Text size="xsmall">
                  Intent:{" "}
                  <Badge size="2xsmall" color="green">
                    {payment.intent}
                  </Badge>
                </Text>
              </div>
              <div>
                <Text size="xsmall">
                  Status:{" "}
                  <Badge size="2xsmall" color="green">
                    {payment.purchase_units[0].payments.captures[0].status}
                  </Badge>
                </Text>
              </div>
              <div>
                <Text size="xsmall">{id} <IconButton size="2xsmall" variant="transparent"><a href={paypalDetailUrl} target="_blank" ><ArrowUpRightOnBox /></a></IconButton> </Text>
              </div>
              <div>
                <Text size="xsmall">
                  Payer: {payment.payer.name.given_name}{" "}
                  {payment.payer.name.surname}
                </Text>
              </div>

              {/* https://www.sandbox.paypal.com/unifiedtransactions/details/payment/04H74758DP041154P */}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
});

export default OrderDetailWidget;
