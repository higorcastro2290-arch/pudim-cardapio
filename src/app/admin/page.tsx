import { AdminDashboard } from "@/components/admin-dashboard";
import { AdminLogin } from "@/components/admin-login";
import { isAdminAuthenticated } from "@/lib/auth";
import { getProductSalesSummary, listOrders } from "@/lib/db";

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return <AdminLogin />;
  }

  const orders = listOrders();
  const productSales = getProductSalesSummary();

  return <AdminDashboard initialOrders={orders} initialProductSales={productSales} />;
}
