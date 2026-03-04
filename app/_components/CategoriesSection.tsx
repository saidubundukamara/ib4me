"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCategoryIcon } from "@/lib/category-icons";

type CategoryItem = {
  _id: string;
  name: string;
  slug: string;
  icon: string | null;
};

export default function CategoriesSection() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.success && Array.isArray(data.data)) {
          setCategories(data.data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="py-14 font-Sora sm:py-18 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center font-Sora text-3xl font-bold sm:mb-12 sm:text-4xl lg:text-5xl">
          Find a <span className="text-fun-green">fundraiser</span> by category
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            return (
              <Link
                key={cat._id}
                href={`/campaigns?category=${cat.slug}`}
                className="group flex h-full w-full flex-col items-center rounded-2xl border border-border bg-background p-4 text-center transition-all hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:p-6"
              >
                <div className="mb-3 rounded-full bg-primary/10 p-3 sm:p-4">
                  <Icon
                    className="h-8 w-8 text-primary transition-colors group-hover:text-blaze-orange sm:h-10 sm:w-10"
                    aria-hidden="true"
                  />
                </div>
                <span className="text-sm font-medium sm:text-base">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
