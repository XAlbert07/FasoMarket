import { useMemo } from "react";
import { useParams } from "react-router-dom";
import BrowseListingsShell from "@/components/listings/BrowseListingsShell";
import { useCategories } from "@/hooks/useCategories";

const CategoryListings = () => {
  const { category: categorySlug } = useParams<{ category: string }>();
  const { categories, loading } = useCategories();

  const matched = useMemo(() => {
    if (!categorySlug) return null;
    const slug = categorySlug.toLowerCase();
    return (
      categories.find((c) => c.slug?.toLowerCase() === slug) ||
      categories.find((c) => c.name.toLowerCase() === slug) ||
      null
    );
  }, [categories, categorySlug]);

  const lockedName = matched?.name || (categorySlug
    ? categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)
    : undefined);

  // Wait for categories when possible so we filter by the real DB name
  if (loading && !matched && categorySlug) {
    return (
      <BrowseListingsShell
        lockCategory
        lockedCategoryName={lockedName}
        title={lockedName}
      />
    );
  }

  return (
    <BrowseListingsShell
      lockCategory
      lockedCategoryName={matched?.name || lockedName}
      title={matched?.name || lockedName}
    />
  );
};

export default CategoryListings;
