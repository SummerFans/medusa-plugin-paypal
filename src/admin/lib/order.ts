declare const __BACKEND_URL__: string;

export default async function getPaypalOrder(id: string) {
  const res = await fetch(`${__BACKEND_URL__||''}/admin/plugin/paypal/orders/${id}`,{
    method:"GET",
    credentials:'include'
  }); 
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to fetch PayPal order: ${data.message}`);
  }
  return data;
}