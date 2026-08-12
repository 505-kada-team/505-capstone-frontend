import { useState } from 'react';
import { useMenuList } from '@/hooks/menu/useMenuList';
import { useArchiveMenu } from '@/hooks/menu/useArchiveMenu';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import Pagination from '@/components/shared/Pagination';
import RecipeCard from './components/RecipeCard';
import AddRecipeModal from './components/AddRecipeModal';
import EditRecipeModal from './components/EditRecipeModal';
import DetailRecipeModal from './components/DetailRecipeModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function RecipePage() {
  const { recipes, pagination, filters, isLoading, setSearch, setStatus, setSort, goToPage: setPage, refetch } = useMenuList();
  const { archiveRecipe } = useArchiveMenu();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailModalId, setDetailModalId] = useState(null);
  const [editTargetId, setEditTargetId] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);

  const displayedRecipes = filters.includeDeleted ? recipes.filter((recipe) => recipe.status === 'deleted') : recipes;

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      const res = await archiveRecipe(archiveTarget);
      if (res.success) {
        toast.success(res.message);
        refetch();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gagal mengarsipkan resep');
    } finally {
      setArchiveTarget(null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Recipes"
        subtitle="Manage your drink recipes and ingredient compositions"
        action={
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-[#F97316] hover:bg-[#F97316]/90 text-white gap-2 font-medium">
            + Add Recipe
          </Button>
        }
      />

      <div className="flex-1 flex flex-col gap-6">
        <div className="flex justify-between items-center gap-2">
          <SearchInput placeholder="Search by name or ingredient..." value={filters.search} onChange={setSearch} className="w-[400px]" />
          <div className="flex items-center gap-3">
            {/* includeDeleted: false -> "Active", true -> "Archived" (backend cuma punya param ini, bukan status string) */}
            <Select value={filters.status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px] h-9 text-muted-foreground font-normal">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort is client-side, only for items on the current page */}
            <Select value={filters.sort} onValueChange={setSort}>
              <SelectTrigger className="w-[160px] gap-2 h-9 text-muted-foreground font-normal">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest Added</SelectItem>
                <SelectItem value="oldest">Oldest Added</SelectItem>
                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                <SelectItem value="cost_high">Highest Cost</SelectItem>
                <SelectItem value="cost_low">Lowest Cost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 relative">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-72 bg-muted/20 animate-pulse rounded-lg border" />
              ))}
            </div>
          ) : displayedRecipes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <span className="text-muted-foreground text-xl">🍽️</span>
              </div>

              <h3 className="text-lg font-semibold text-foreground">{filters.status === 'archived' ? 'Belum ada resep yang diarsipkan' : 'Tidak ada resep'}</h3>

              <p className="text-sm text-muted-foreground">{filters.status === 'archived' ? 'Resep yang sudah diarsipkan akan muncul di sini.' : 'Silakan tambah resep baru atau coba pencarian lain.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {displayedRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} onDetail={() => setDetailModalId(recipe.id)} />
              ))}
            </div>
          )}
        </div>

        {displayedRecipes.length > 0 && pagination && pagination.totalPage > 1 && (
          <div className="mt-auto">
            <Pagination currentPage={pagination.currentPage} totalPage={pagination.totalPage} totalData={pagination.totalData} limit={pagination.limit} onPageChange={setPage} />
          </div>
        )}
      </div>

      <AddRecipeModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={refetch} />

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

      {editTargetId && <EditRecipeModal isOpen={!!editTargetId} recipeId={editTargetId} onClose={() => setEditTargetId(null)} onSuccess={refetch} />}

      <ConfirmDialog
        open={!!archiveTarget}
        title="Archive Recipe?"
        description="The archived recipe will not appear in the main list, but can still be viewed in the plan history."
        confirmLabel="Archive"
        cancelLabel="Cancel"
        onConfirm={handleArchive}
        onClose={() => setArchiveTarget(null)}
        variant="destructive"
      />
    </div>
  );
}
