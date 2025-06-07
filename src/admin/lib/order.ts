export default async function getPaypalOrder(id: string) {
  const res = await fetch(`/admin/plugin/paypal/orders/${id}`); 
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to fetch PayPal order: ${data.message}`);
  }
  return data;
}