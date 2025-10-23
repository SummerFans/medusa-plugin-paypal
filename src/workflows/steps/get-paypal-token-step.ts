import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYPAL_MODULE } from "../../modules/paypal"
import PaypalModuleService from "../../modules/paypal/service"

const PAYPAL_TOKEN_CACHE_NAME = 'PAYPAL_TOKEN'

const getPaypalTokenStepId = 'get-paypal-token-step'
const getPaypalToken = createStep(
  getPaypalTokenStepId,
  async (_, { container }) => {
    // const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
    const cachingModuleService = container.resolve(Modules.CACHING);
    const paypalModuleService: PaypalModuleService = container.resolve(PAYPAL_MODULE);

    const result = await cachingModuleService.get({ key: PAYPAL_TOKEN_CACHE_NAME }) as { access_token: string, expires_in: number }

    if (!result) {
      const { access_token, expires_in } = await paypalModuleService.getToken()
      await cachingModuleService.set({
        key: PAYPAL_TOKEN_CACHE_NAME,
        data: { access_token, expires_in },
        ttl: expires_in
      })
      return new StepResponse({ token: access_token });
    }
    return new StepResponse({ token: result.access_token });
  }
)

export default getPaypalToken;