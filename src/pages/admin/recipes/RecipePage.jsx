import { useState, useEffect } from "react";
import { useMenuList } from "@/hooks/menu/useMenuList";
import { useArchiveMenu } from "@/hooks/menu/useArchiveMenu";
import { usePagination } from "@/hooks/usePagination";
import PageHeader from "@/components/shared/PageHeader";
import SearchInput from "@/components/shared/SearchInput";
import Pagination from "@/components/shared/Pagination";
import RecipeCard from "./components/RecipeCard";
import AddRecipeModal from "./components/AddRecipeModal";
import EditRecipeModal from "./components/EditRecipeModal";
import DetailRecipeModal from "./components/DetailRecipeModal";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const PAGE_SIZE = 12;

export default function RecipePage() {
  const {
    recipes,
    pagination,
    filters,
    isLoading,
    setSearch,
    setIncludeDeleted,
    setSort,
    setPage,
    refetch,
  } = useMenuList();

  const { archiveRecipe, isArchiving } = useArchiveMenu();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailModalId, setDetailModalId] = useState(null);
  const [editTargetId, setEditTargetId] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);

  // Filter data client-side
  const displayedRecipes = filters.includeDeleted
    ? recipes.filter((recipe) => recipe.status === "deleted")
    : recipes;

  // Pagination lokal
  const { currentPage, totalPages, paginatedItems, resetPage } = usePagination(
    displayedRecipes,
    PAGE_SIZE,
  );

  // Reset ke halaman 1 ketika filter berubah
  useEffect(() => {
    resetPage();
  }, [filters.search, filters.includeDeleted, filters.sort, resetPage]);

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      const res = await archiveRecipe(archiveTarget);
      if (res.success) {
        toast.success(res.message);
        refetch();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to archive recipe");
    } finally {
      setArchiveTarget(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header - tetap di atas */}
      <PageHeader
        title="Recipes"
        subtitle="Manage your drink recipes and ingredient compositions"
        action={
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#F97316] hover:bg-[#F97316]/90 text-white gap-2 font-medium transition-transform active:scale-[0.97]"
          >
            + Add Recipe
          </Button>
        }
      />

      {/* Filter toolbar - tetap di atas, tidak ikut scroll */}
      <div className="flex-shrink-0 mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
          <SearchInput
            placeholder="Search by name or ingredient..."
            value={filters.search}
            onChange={setSearch}
            className="w-full sm:w-[320px] sm:flex-none h-9 bg-background"
          />

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:ml-auto">
            <Select
              value={filters.includeDeleted ? "deleted" : "active"}
              onValueChange={(val) => setIncludeDeleted(val === "archived")}
            >
              <SelectTrigger className="w-full sm:w-[130px] h-9 bg-background text-muted-foreground font-normal text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Deleted</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.sort} onValueChange={setSort}>
              <SelectTrigger className="w-full sm:w-[130px] h-9 bg-background text-muted-foreground font-normal text-xs">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                <SelectItem value="cost_high">Highest Cost</SelectItem>
                <SelectItem value="cost_low">Lowest Cost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Area scroll untuk card + pagination */}
      <div className="flex-1 min-h-0  mt-4">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {[...Array(PAGE_SIZE)].map((_, i) => (
              <div
                key={i}
                style={{ animationDelay: `${i * 60}ms` }}
                className="aspect-square bg-muted/20 animate-pulse rounded-lg border"
              />
            ))}
          </div>
        ) : displayedRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <span className="text-muted-foreground text-xl">🍽️</span>
            </div>

            <h3 className="text-lg font-semibold text-foreground">
              {filters.includeDeleted
                ? "No deleted recipes yet"
                : "No recipes found"}
            </h3>

            <p className="text-sm text-muted-foreground">
              {filters.includeDeleted
                ? "Deleted recipes will appear here."
                : "Please add a new recipe or try a different search."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {displayedRecipes.map((recipe, i) => (
                <div
                  key={recipe.id}
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
                >
                  <RecipeCard
                    recipe={recipe}
                    onDetail={() => setDetailModalId(recipe.id)}
                  />
                </div>
              ))}
            </div>
            {/* Pagination */}
            {displayedRecipes.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 mt-6 border-t border-border/60">
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                  Showing {((pagination?.currentPage ?? 1) - 1) * PAGE_SIZE + 1}{" "}
                  -{" "}
                  {Math.min(
                    (pagination?.currentPage ?? 1) * PAGE_SIZE,
                    pagination?.totalData ?? 0,
                  )}{" "}
                  of {pagination?.totalData ?? 0} items
                </div>
                <Pagination
                  currentPage={pagination?.currentPage ?? 1}
                  totalPage={pagination?.totalPage ?? 1}
                  totalData={pagination?.totalData ?? 0}
                  limit={PAGE_SIZE}
                  onPageChange={setPage}
                  showInfo={false}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal dan Dialog */}
      <AddRecipeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={refetch}
      />

      {detailModalId && (
        <DetailRecipeModal
          isOpen={!!detailModalId}
          recipeId={detailModalId}
          onClose={() => setDetailModalId(null)}
          onArchive={(id) => {
            setDetailModalId(null);
            setArchiveTarget(id);
          }}
          onEdit={(id) => {
            setDetailModalId(null);
            setEditTargetId(id);
          }}
        />
      )}

      {editTargetId && (
        <EditRecipeModal
          isOpen={!!editTargetId}
          recipeId={editTargetId}
          onClose={() => setEditTargetId(null)}
          onSuccess={refetch}
        />
      )}

      <ConfirmDialog
        open={!!archiveTarget}
        title="Delete Recipe?"
        description="Deleted recipes will not appear in the main list, but can still be viewed in plan history."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleArchive}
        onClose={() => setArchiveTarget(null)}
        variant="destructive"
        loading={isArchiving}
      />

    </div>
  );
}
