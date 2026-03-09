"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/products/filter-bar";
import { ProductGrid } from "@/components/products/product-grid";
import { GridSkeleton } from "@/components/ui/loading";
import { useData } from "@/contexts/data-context";

export default function ProductsPage() {
  const { loading } = useData();

  return (
    <AppShell>
      <PageHeader
        title="Products"
        description="Your saved collection"
        action={
          <Link href="/products/new">
            <Button>
              <Plus size={16} />
              Add Product
            </Button>
          </Link>
        }
      />
      <FilterBar />
      {loading ? <GridSkeleton /> : <ProductGrid />}
    </AppShell>
  );
}
