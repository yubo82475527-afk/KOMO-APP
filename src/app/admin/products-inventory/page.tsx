import { AdminPlaceholderPage } from "@/features/admin/admin-placeholder-page";

export default function AdminProductsInventoryPage({ searchParams }: { searchParams: Promise<{ scopeDepartmentId?: string }> }) {
  return (
    <AdminPlaceholderPage
      active="productsInventory"
      redirectTo="/admin/products-inventory"
      title="商品与库存"
      description="商品与库存模块暂未开放，后续将补充商品、库存、调拨和盘点管理能力。"
      searchParams={searchParams}
    />
  );
}
