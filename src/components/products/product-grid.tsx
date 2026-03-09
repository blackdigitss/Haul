"use client";

import { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence } from "framer-motion";
import { Package } from "lucide-react";
import { ProductCard } from "./product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useData } from "@/contexts/data-context";
import { midpoint } from "@/lib/utils";
import type { Product, Tier } from "@/types";
import Link from "next/link";

function SortableProductCard({
  product,
  onDelete,
  onTierChange,
  onAddToHaul,
}: {
  product: Product;
  onDelete: (id: string) => void;
  onTierChange: (id: string, tier: Tier) => void;
  onAddToHaul: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto" as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <ProductCard
        product={product}
        onDelete={onDelete}
        onTierChange={onTierChange}
        onAddToHaul={onAddToHaul}
        isDraggable
        dragHandleProps={listeners}
      />
    </div>
  );
}

export function ProductGrid() {
  const {
    filteredProducts,
    updateProduct,
    deleteProduct,
    batchUpdateProducts,
    filters,
  } = useData();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (window.confirm("Delete this product?")) {
        await deleteProduct(id);
      }
    },
    [deleteProduct]
  );

  const handleTierChange = useCallback(
    async (id: string, tier: Tier) => {
      await updateProduct(id, { tier });
    },
    [updateProduct]
  );

  const handleAddToHaul = useCallback(
    (id: string) => {
      // Will be handled by modal in a future iteration
      updateProduct(id, { status: "in-haul" });
    },
    [updateProduct]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = filteredProducts.findIndex((p) => p.id === active.id);
      const newIndex = filteredProducts.findIndex((p) => p.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const before = newIndex > 0 ? filteredProducts[newIndex - 1].sort_order : 0;
      const after =
        newIndex < filteredProducts.length - 1
          ? filteredProducts[newIndex + 1].sort_order
          : before + 2;

      const newSortOrder =
        newIndex < oldIndex ? midpoint(before, filteredProducts[newIndex].sort_order) : midpoint(filteredProducts[newIndex].sort_order, after);

      await updateProduct(active.id as string, { sort_order: newSortOrder });
    },
    [filteredProducts, updateProduct]
  );

  if (filteredProducts.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="No products found"
        description={
          filters.search || filters.categories.length > 0
            ? "Try adjusting your filters or search terms"
            : "Save your first product to get started"
        }
        action={
          !filters.search && filters.categories.length === 0 ? (
            <Link href="/products/new">
              <Button>Add First Product</Button>
            </Link>
          ) : undefined
        }
      />
    );
  }

  const isSortByCustom = filters.sort_by === "sort_order";

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={filteredProducts.map((p) => p.id)}
        strategy={rectSortingStrategy}
        disabled={!isSortByCustom}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) =>
              isSortByCustom ? (
                <SortableProductCard
                  key={product.id}
                  product={product}
                  onDelete={handleDelete}
                  onTierChange={handleTierChange}
                  onAddToHaul={handleAddToHaul}
                />
              ) : (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDelete={handleDelete}
                  onTierChange={handleTierChange}
                  onAddToHaul={handleAddToHaul}
                />
              )
            )}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  );
}
