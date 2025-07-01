# Medusa-plugin-paypal
medusa-plugin-paypal is a integration of payment provider for Paypal.

**[Example](https://github.com/SummerFans/medusa-plugin-paypal/tree/dev/example)**

## ⚠️ Warn
>| Requires Medusa v2.7.0 or later.


## Installaction
```
npm i medusa-plugin-paypal
```

## Backend

```js
// medusa-config.js
...
modules:[
  {
    resolve: "@medusajs/medusa/payment",
    options: {
      providers: [
        {
          resolve: "medusa-plugin-paypal/providers/paypal-payment",
            id: "payment-paypal",
            options: {
              intent:{'CAPTURE' | 'AUTHORIZE'}
              clientId: {string},
              clientSecret: {string},
              sandbox: {boolean},
              webhookId: {string}

          },
        }
      ]
    }
  }
]
plugins: [
    {
      resolve: "medusa-paypal-payment",
      options: {
        intent:{'CAPTURE' | 'AUTHORIZE'}
        clientId: {string},
        clientSecret: {string},
        sandbox: {boolean},
        webhookId: {string}
      },
    }
]

```

## Store

1) Create `/src/modules/checkout/components/payment-wrapper/paypal-wrapper.tsx`
```tsx
"use client"

import { HttpTypes } from "@medusajs/types"
import { createContext } from "react"

import {
  PayPalScriptProvider,
  ReactPayPalScriptOptions,
} from "@paypal/react-paypal-js"

type PaypalWrapperProps = {
  paymentSession: HttpTypes.StorePaymentSession
  clientId: string
  children: React.ReactNode
}

export const PaypalContext = createContext(false)

const PaypalWrapper: React.FC<PaypalWrapperProps> = ({
  paymentSession,
  clientId,
  children,
}) => {

  const initialOptions: ReactPayPalScriptOptions = {
    clientId,
    currency: paymentSession.currency_code.toLocaleUpperCase(),
    intent: "capture",
    components:"buttons",
    debug:false
  }

  return (
    <PayPalScriptProvider deferLoading={false} options={initialOptions}>
      {children}
    </PayPalScriptProvider>
  )
}

export default PaypalWrapper

```

2) Update `/src/modules/checkout/components/payment-wrapper/index.tsx`
```tsx
// add 
// !!!isPaypal() is 'pp_paypal'
if (isPaypal(paymentSession?.provider_id) && paymentSession) {
    return (
      <PaypalWrapper
        paymentSession={paymentSession}
        clientId={paypaylClientId}
      >
        {children}
      </PaypalWrapper>
    )
  }

```
3) Update `/src/modules/checkout/components/payment-button/index.tsx`
```tsx
// add paypal button
const PaypalPaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)


  const onPaymentCompleted = async () => {
    await placeOrder()
  }


  const handlePayment = async (
    _data: OnApproveData,
    actions: OnApproveActions
  ) => {
    setSubmitting(true)
    await actions?.order
      ?.capture()
      .then((authorization) => {
        if (authorization.status !== "COMPLETED") {
          setSubmitting(false)
          setErrorMessage(`An error occurred, status: ${authorization.status}`)
          return
        }
        onPaymentCompleted()
      })
      .catch((error) => {
        setErrorMessage(`An unknown error occurred, please try again.`)
        setSubmitting(false)
      })
  }

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )
  return (
    <>
      <PayPalButtons
        disabled={submitting}
        createOrder={async (data, actions) => {
          return session?.data.id as string
        }}
        onApprove={handlePayment}
        onError={(err) => {
          console.error("PayPal Checkout onError", err)
        }}
        style={styles}
      />
      <ErrorMessage
        error={errorMessage}
        data-testid="paypal-payment-error-message"
      />
    </>
  )
}


// Update PaymentButton 
const PaymentButton: React.FC<PaymentButtonProps> = ({
...
switch (true) {
  ...
  case isPaypal(paymentSession?.provider_id):
      return (
        <PaypalPaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
  ...
}
...
})
```