import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import getPaypalOrderStep from "./steps/get-paypal-order-step";
import getPaypalToken from "./steps/get-paypal-token-step";

interface GetPaypalOrderWorkflowInput {
  orderId: string
}

const getPaypalOrderWorkflow = createWorkflow(
  'get-paypal-order-workflow',
  ({ orderId }: GetPaypalOrderWorkflowInput) => {

    const { token } = getPaypalToken()

    const order = getPaypalOrderStep({ orderId, token })

    return new WorkflowResponse({order})
  }
)

export default getPaypalOrderWorkflow;