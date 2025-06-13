import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { PAYPAL_MODULE } from "../../../../../../modules/paypal";
import PaypalModuleService from "../../../../../../modules/paypal/service";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const paypalService: PaypalModuleService = req.scope.resolve(PAYPAL_MODULE);

  const order = await paypalService.getOrder(req.params.id)

  res.json(order);
}
