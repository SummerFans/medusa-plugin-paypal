import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYPAL_MODULE } from "../../modules/paypal"
import PaypalModuleService from "../../modules/paypal/service"

const PAYPAL_TOKEN_CACHE_NAME = 'PAYPAL_TOKEN'

const getPaypalTokenStepId = 'get-paypal-token-step'
const getPaypalToken = createStep(
  getPaypalTokenStepId,
  async (_, { container }) => {
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const cacheModuleService = container.resolve(Modules.CACHE);
    const paypalModuleService: PaypalModuleService = container.resolve(PAYPAL_MODULE);

    const token = await cacheModuleService.get(PAYPAL_TOKEN_CACHE_NAME) as string

    if (!token) {
      const { access_token, expires_in } = await paypalModuleService.getToken()
      await cacheModuleService.set(PAYPAL_TOKEN_CACHE_NAME, access_token, expires_in)
      return new StepResponse({ token: access_token });
    }


    return new StepResponse({ token });


  }
)

export default getPaypalToken;