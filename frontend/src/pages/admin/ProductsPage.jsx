import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORY_LABELS = {
  ao: 'Áo', quan: 'Quần', vay: 'Váy', dam: 'Đầm',
  outerwear: 'Áo Khoác', 'phu-kien': 'Phụ Kiện', 'giay-dep': 'Giày Dép',
};

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchProducts = async (params = {}) => {
    try {
      setLoading(true);
      const res = await adminApi.getProducts({ page, limit: 20, ...params });
      setProducts(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts({ page, search: search || undefined });
  }, [page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts({ page: 1, search: search || undefined });
  };

  const handleToggleActive = async (product) => {
    try {
      await adminApi.updateProduct(product._id, { isActive: !product.isActive });
      toast.success(product.isActive ? 'Đã ẩn sản phẩm' : 'Đã hiện sản phẩm');
      fetchProducts({ page, search: search || undefined });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Ẩn sản phẩm "${product.name}"?`)) return;
    await handleToggleActive({ ...product, isActive: true });
  };

  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN').format(p) + '₫';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Sản phẩm</h1>
        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 bg-bobo-black text-white px-4 py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus size={18} /> Thêm sản phẩm
        </Link>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên sản phẩm..."
            className="w-full border border-gray-200 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-gray-900"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-gray-900 text-white text-sm hover:bg-gray-700 transition-colors">
          Tìm
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Sản phẩm</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Danh mục</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Giá</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Tồn kho</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Đã bán</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Trạng thái</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    Không có sản phẩm nào
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className={`hover:bg-gray-50 transition-colors ${!p.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 line-clamp-1 max-w-[200px]">{p.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.slug}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {CATEGORY_LABELS[p.category] || p.category}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.salePrice ? (
                        <div>
                          <p className="font-medium text-red-600">{formatPrice(p.salePrice)}</p>
                          <p className="text-xs text-gray-400 line-through">{formatPrice(p.basePrice)}</p>
                        </div>
                      ) : (
                        <p className="font-medium">{formatPrice(p.basePrice)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${p.totalStock === 0 ? 'text-red-600' : p.totalStock < 10 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {p.totalStock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{p.soldCount}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                        ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isActive ? 'Đang bán' : 'Đã ẩn'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          to={`/admin/products/${p._id}/edit`}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={15} />
                        </Link>
                        <button
                          onClick={() => handleToggleActive(p)}
                          className="p-1.5 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                          title={p.isActive ? 'Ẩn sản phẩm' : 'Hiện sản phẩm'}
                        >
                          {p.isActive ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-600">
            <p>Tổng {pagination.total} sản phẩm</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span>Trang {page} / {pagination.totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-1.5 hover:bg-gray-100 rounded disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
