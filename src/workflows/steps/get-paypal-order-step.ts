import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { PAYPAL_MODULE } from "../../modules/paypal";
import PaypalModuleService from "../../modules/paypal/service";

interface getPaypalOrderInput {
  orderId: string
  token: string;
}

const getPaypalOrderStep = createStep(
  'get-paypal-order-step',
  async ({ orderId, token }: getPaypalOrderInput, { container }) => {

    const paypalModuleService: PaypalModuleService = container.resolve(PAYPAL_MODULE)

    const order = await paypalModuleService.getOrder({
      orderId,
      token,
    })

    return new StepResponse(order);

  }
)

export default getPaypalOrderStep;