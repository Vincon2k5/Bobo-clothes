import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { productApi } from '../../services/api';
import ProductCard from '../ProductCard/ProductCard';

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Mới nhất' },
  { value: '-soldCount', label: 'Bán chạy nhất' },
  { value: '-rating.average', label: 'Đánh giá cao nhất' },
  { value: 'basePrice', label: 'Giá: Thấp → Cao' },
  { value: '-basePrice', label: 'Giá: Cao → Thấp' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const CATEGORIES = [
  { value: 'ao', label: 'Áo' },
  { value: 'quan', label: 'Quần' },
  { value: 'vay', label: 'Váy' },
  { value: 'dam', label: 'Đầm' },
  { value: 'outerwear', label: 'Áo Khoác' },
  { value: 'phu-kien', label: 'Phụ Kiện' },
];

/**
 * ProductList - Trang danh sách sản phẩm với filter và sort
 */
const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Lấy params từ URL
  const currentCategory = searchParams.get('category') || '';
  const currentSort = searchParams.get('sort') || '-createdAt';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const selectedSizes = searchParams.getAll('size');
  const searchQuery = searchParams.get('search') || '';

  // Fetch products khi params thay đổi
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const params = {
          ...(currentCategory && { category: currentCategory }),
          ...(currentSort && { sort: currentSort }),
          ...(currentPage > 1 && { page: currentPage }),
          ...(selectedSizes.length && { size: selectedSizes.join(',') }),
          ...(searchQuery && { search: searchQuery }),
          limit: 12,
        };

        const response = await productApi.getAll(params);
        setProducts(response.data);
        setPagination(response.pagination);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentCategory, currentSort, currentPage, searchParams.toString()]);

  const updateParam = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value);
      else next.delete(key);
      next.delete('page'); // Reset page khi filter thay đổi
      return next;
    });
  };

  const toggleSize = (size) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const sizes = next.getAll('size');
      next.delete('size');
      if (sizes.includes(size)) {
        sizes.filter((s) => s !== size).forEach((s) => next.append('size', s));
      } else {
        [...sizes, size].forEach((s) => next.append('size', s));
      }
      next.delete('page');
      return next;
    });
  };

  const categoryLabel = CATEGORIES.find((c) => c.value === currentCategory)?.label;

  return (
    <div className="container-main py-8">
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-semibold">
          {searchQuery
            ? `Kết quả tìm kiếm: "${searchQuery}"`
            : categoryLabel || 'Tất cả sản phẩm'}
        </h1>
        {pagination && (
          <p className="text-sm text-bobo-gray-500 mt-1">{pagination.total} sản phẩm</p>
        )}
      </div>

      {/* Toolbar: Filter + Sort */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 text-sm border border-bobo-gray-200 px-4 py-2.5
                     hover:border-bobo-black transition-colors"
        >
          <SlidersHorizontal size={16} />
          Bộ lọc
          {selectedSizes.length > 0 && (
            <span className="bg-bobo-black text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {selectedSizes.length}
            </span>
          )}
        </button>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={currentSort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="appearance-none border border-bobo-gray-200 px-4 py-2.5 text-sm pr-8
                       focus:outline-none focus:border-bobo-black cursor-pointer bg-white"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Filter Panel */}
      {isFilterOpen && (
        <div className="border border-bobo-gray-100 p-5 mb-6 bg-bobo-gray-50 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Category Filter */}
            <div>
              <h4 className="text-sm font-semibold mb-3 uppercase tracking-wider">Danh mục</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateParam('category', '')}
                  className={`text-xs px-3 py-1.5 border transition-colors
                    ${!currentCategory ? 'bg-bobo-black text-white border-bobo-black' : 'border-bobo-gray-200 hover:border-bobo-black'}`}
                >
                  Tất cả
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => updateParam('category', cat.value)}
                    className={`text-xs px-3 py-1.5 border transition-colors
                      ${currentCategory === cat.value ? 'bg-bobo-black text-white border-bobo-black' : 'border-bobo-gray-200 hover:border-bobo-black'}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div>
              <h4 className="text-sm font-semibold mb-3 uppercase tracking-wider">Kích cỡ</h4>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`w-11 h-10 text-xs font-medium border transition-colors
                      ${selectedSizes.includes(size) ? 'bg-bobo-black text-white border-bobo-black' : 'border-bobo-gray-200 hover:border-bobo-black'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {(currentCategory || selectedSizes.length > 0) && (
            <button
              onClick={() => setSearchParams({})}
              className="flex items-center gap-1 text-sm text-bobo-gray-500 hover:text-bobo-black mt-4 transition-colors"
            >
              <X size={14} /> Xóa tất cả bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <ProductGridSkeleton />
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-bobo-gray-500 mb-4">Không tìm thấy sản phẩm nào</p>
          <button onClick={() => setSearchParams({})} className="btn-secondary text-sm px-8">
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => updateParam('page', page.toString())}
              className={`w-10 h-10 text-sm font-medium transition-colors
                ${page === currentPage
                  ? 'bg-bobo-black text-white'
                  : 'border border-bobo-gray-200 hover:border-bobo-black'
                }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Loading Skeleton
const ProductGridSkeleton = () => (
  <div className="product-grid">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="aspect-[3/4] bg-bobo-gray-100" />
        <div className="mt-3 space-y-2">
          <div className="h-3 bg-bobo-gray-100 rounded w-3/4" />
          <div className="h-3 bg-bobo-gray-100 rounded w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export default ProductList;
