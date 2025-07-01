import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import getPaypalOrderWorkflow from "../../../../../../workflows/get-paypal-order-workflow";

export async function GET(req: MedusaRequest, res: MedusaResponse) {

  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER);

  if (!req.params.id) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'params error');
  }

  const {result} = await getPaypalOrderWorkflow(req.scope).run({
    input: {
      orderId: req.params.id
    }
  })
  res.json(result.order);
}
