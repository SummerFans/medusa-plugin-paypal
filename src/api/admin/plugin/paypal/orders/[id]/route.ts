import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { PAYPAL_MODULE } from "../../../../../../modules/paypal";
import PaypalModuleService from "../../../../../../modules/paypal/service";
import { MedusaError } from "@medusajs/framework/utils";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const paypalService: PaypalModuleService = req.scope.resolve(PAYPAL_MODULE);

  if(!req.params.id){
    throw new MedusaError(MedusaError.Types.INVALID_DATA,'params error');
  }

  const order = await paypalService.getOrder(req.params.id)

  res.json(order);
}
