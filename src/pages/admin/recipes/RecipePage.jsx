import { useState, useEffect } from 'react';
import { getMenuList, archiveMenu } from '@/services/api';
import { useSortable } from '@/hooks/useSortable';
import PageHeader from '@/components/shared/PageHeader';
import SearchInput from '@/components/shared/SearchInput';
import Pagination from '@/components/shared/Pagination';
import RecipeCard from './components/RecipeCard';
import AddRecipeModal from './components/AddRecipeModal';
import DetailRecipeModal from './components/DetailRecipeModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function RecipePage() {
  const [recipes, setRecipes] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPage: 1 });
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const { sortBy, setSortBy } = useSortable('name_asc');
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailModalId, setDetailModalId] = useState(null);
  
  // Archive Confirmation
  const [archiveTarget, setArchiveTarget] = useState(null);

  const fetchRecipes = async (page = 1, searchQuery = '', status = 'active', sort = 'name_asc') => {
    setIsLoading(true);
    try {
      const params = { 
        page, 
        limit: 12, 
        search: searchQuery, 
        status,
        sort 
      };
      const res = await getMenuList(params);
      if (res.data.success) {
        setRecipes(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error(err?.message || 'Gagal memuat resep');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchRecipes(1, search, filterStatus, sortBy);
    }, 300);
    return () => clearTimeout(delay);
  }, [search, filterStatus, sortBy]);

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPage) {
      fetchRecipes(newPage, search, filterStatus, sortBy);
    }
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      const res = await archiveMenu(archiveTarget);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchRecipes(pagination.currentPage, search, filterStatus);
      }
    } catch (err) {
      toast.error(err?.message || 'Gagal mengarsipkan resep');
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
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#F97316] hover:bg-[#F97316]/90 text-white gap-2 font-medium"
          >
            + Add Recipe
          </Button>
        }
      />

      <div className="p-6 flex-1 flex flex-col gap-6">
        <div className="flex justify-between items-center gap-2">
          <SearchInput
            placeholder="Search by name or ingredient..."
            value={search}
            onChange={setSearch}
            className="w-[400px]"
          />
          <div className="flex items-center gap-3">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px] h-9 text-muted-foreground font-normal">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px] gap-2 h-9 text-muted-foreground font-normal">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Nama (A-Z)</SelectItem>
                <SelectItem value="name_desc">Nama (Z-A)</SelectItem>
                <SelectItem value="cost_high">Modal Tertinggi</SelectItem>
                <SelectItem value="cost_low">Modal Terendah</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-72 bg-muted/20 animate-pulse rounded-lg border"></div>
              ))}
            </div>
          ) : recipes.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <span className="text-muted-foreground text-xl">🍽️</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">Tidak ada resep</h3>
              <p className="text-sm text-muted-foreground">Silakan tambah resep baru atau coba pencarian lain.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe._id}
                  recipe={recipe}
                  onDetail={() => setDetailModalId(recipe._id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {recipes.length > 0 && pagination.totalPage > 1 && (
          <div className="mt-auto">
            <Pagination
              currentPage={pagination.currentPage}
              totalPage={pagination.totalPage}
              totalData={pagination.totalData}
              limit={pagination.limit}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <AddRecipeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchRecipes(1, search)}
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
          onEdit={() => {
            toast.info('Fitur edit akan digabung dengan modal form nanti');
          }}
        />
      )}

      {/* Archive Confirmation */}
      <ConfirmDialog
        open={!!archiveTarget}
        title="Arsipkan Resep?"
        description="Resep yang diarsipkan tidak akan muncul di daftar utama, tapi tetap dapat dilihat di riwayat plan."
        confirmLabel="Arsipkan"
        cancelLabel="Batal"
        onConfirm={handleArchive}
        onClose={() => setArchiveTarget(null)}
        variant="destructive"
      />
    </div>
  );
}
