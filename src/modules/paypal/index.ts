import PaypalModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const PAYPAL_MODULE = "deepseek_service"

export default Module(PAYPAL_MODULE, {
  service: PaypalModuleService,
})