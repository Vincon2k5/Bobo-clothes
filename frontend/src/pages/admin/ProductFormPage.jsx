import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'ao', label: 'Áo' },
  { value: 'quan', label: 'Quần' },
  { value: 'vay', label: 'Váy' },
  { value: 'dam', label: 'Đầm' },
  { value: 'outerwear', label: 'Áo Khoác' },
  { value: 'phu-kien', label: 'Phụ Kiện' },
  { value: 'giay-dep', label: 'Giày Dép' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'ONE SIZE'];

const emptyVariant = () => ({
  size: 'M', color: '', colorHex: '#000000', sku: '', stock: 0, priceOverride: '',
});

const ProductFormPage = () => {
  const { id } = useParams(); // undefined nếu là trang "Thêm mới"
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '', slug: '', description: '', shortDescription: '',
    category: 'ao', subCategory: '',
    basePrice: '', salePrice: '', discountPercent: '',
    images: [''],
    material: '', tags: '',
    isActive: true, isFeatured: false,
    variants: [emptyVariant()],
  });

  // Load sản phẩm khi edit
  useEffect(() => {
    if (!isEdit) return;
    loadProduct(id);
  }, [id]);

  const loadProduct = async (productId) => {
    try {
      // Lấy chi tiết đầy đủ qua public slug endpoint (dùng id tạm để search)
      const api = (await import('../../services/api')).default;
      // Admin endpoint trả về danh sách, lấy 1 trang lớn để tìm theo _id
      const res = await api.get('/admin/products', { params: { limit: 200 } });
      const p = res.data?.find((x) => x._id === productId);

      // Nếu không có trong danh sách rút gọn, thử public endpoint
      if (!p) {
        toast.error('Không tìm thấy sản phẩm');
        setLoading(false);
        return;
      }

      setForm({
        name: p.name || '', slug: p.slug || '',
        description: p.description || '', shortDescription: p.shortDescription || '',
        category: p.category || 'ao', subCategory: p.subCategory || '',
        basePrice: p.basePrice || '', salePrice: p.salePrice || '',
        discountPercent: p.discountPercent || '',
        images: p.images?.length ? p.images : [''],
        material: p.material || '',
        tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
        isActive: p.isActive ?? true, isFeatured: p.isFeatured ?? false,
        variants: p.variants?.length ? p.variants.map((v) => ({
          ...v, priceOverride: v.priceOverride ?? '',
        })) : [emptyVariant()],
      });
    } catch (err) {
      toast.error('Không thể tải thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Auto tạo slug từ tên
  const handleNameChange = (value) => {
    const slug = value
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim().replace(/\s+/g, '-');
    setForm((f) => ({ ...f, name: value, slug }));
  };

  const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // Variants
  const addVariant = () => setForm((f) => ({ ...f, variants: [...f.variants, emptyVariant()] }));
  const removeVariant = (i) => setForm((f) => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));
  const updateVariant = (i, key, value) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, idx) => idx === i ? { ...v, [key]: value } : v),
    }));

  // Images
  const addImageField = () => setForm((f) => ({ ...f, images: [...f.images, ''] }));
  const removeImageField = (i) => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
  const updateImage = (i, value) =>
    setForm((f) => ({ ...f, images: f.images.map((img, idx) => idx === i ? value : img) }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    if (!form.name.trim()) return toast.error('Vui lòng nhập tên sản phẩm');
    if (!form.basePrice || Number(form.basePrice) <= 0) return toast.error('Vui lòng nhập giá hợp lệ');
    if (form.variants.some((v) => !v.color.trim())) return toast.error('Vui lòng điền màu sắc cho tất cả biến thể');

    const payload = {
      ...form,
      basePrice: Number(form.basePrice),
      salePrice: form.salePrice ? Number(form.salePrice) : null,
      discountPercent: form.discountPercent ? Number(form.discountPercent) : 0,
      images: form.images.filter(Boolean),
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      variants: form.variants.map((v) => ({
        ...v,
        stock: Number(v.stock),
        priceOverride: v.priceOverride !== '' ? Number(v.priceOverride) : null,
      })),
    };

    try {
      setSaving(true);
      if (isEdit) {
        await adminApi.updateProduct(id, payload);
        toast.success('Đã cập nhật sản phẩm!');
      } else {
        await adminApi.createProduct(payload);
        toast.success('Đã thêm sản phẩm mới!');
        navigate('/admin/products');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4">{Array.from({length:6}).map((_,i)=><div key={i} className="h-12 bg-gray-100 rounded"/>)}</div>;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/admin/products')} className="p-2 hover:bg-gray-100 rounded transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Thông tin cơ bản */}
        <Section title="Thông tin cơ bản">
          <div className="grid grid-cols-1 gap-4">
            <Field label="Tên sản phẩm *">
              <input className="input-base" value={form.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="VD: Áo Thun BoBo Classic" required />
            </Field>
            <Field label="Slug (URL)" hint="Tự động tạo từ tên">
              <input className="input-base bg-gray-50" value={form.slug} onChange={(e) => updateField('slug', e.target.value)} placeholder="ao-thun-bobo-classic" />
            </Field>
            <Field label="Mô tả *">
              <textarea className="input-base resize-none" rows={4} value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Mô tả chi tiết về sản phẩm..." required />
            </Field>
            <Field label="Mô tả ngắn">
              <input className="input-base" value={form.shortDescription} onChange={(e) => updateField('shortDescription', e.target.value)} placeholder="Hiển thị trên card sản phẩm" maxLength={300} />
            </Field>
          </div>
        </Section>

        {/* Danh mục & Tags */}
        <Section title="Danh mục">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Danh mục *">
              <select className="input-base" value={form.category} onChange={(e) => updateField('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </Field>
            <Field label="Danh mục phụ">
              <input className="input-base" value={form.subCategory} onChange={(e) => updateField('subCategory', e.target.value)} placeholder="ao-thun, quan-jean..." />
            </Field>
            <Field label="Tags" hint="Cách nhau bởi dấu phẩy" className="col-span-2">
              <input className="input-base" value={form.tags} onChange={(e) => updateField('tags', e.target.value)} placeholder="new-arrival, best-seller, sale, summer-2025" />
            </Field>
          </div>
        </Section>

        {/* Giá */}
        <Section title="Giá bán">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Giá gốc (₫) *">
              <input type="number" className="input-base" value={form.basePrice} onChange={(e) => updateField('basePrice', e.target.value)} placeholder="299000" min="0" required />
            </Field>
            <Field label="Giá khuyến mãi (₫)">
              <input type="number" className="input-base" value={form.salePrice} onChange={(e) => updateField('salePrice', e.target.value)} placeholder="Để trống nếu không giảm" min="0" />
            </Field>
            <Field label="% Giảm giá">
              <input type="number" className="input-base" value={form.discountPercent} onChange={(e) => updateField('discountPercent', e.target.value)} placeholder="0" min="0" max="100" />
            </Field>
          </div>
        </Section>

        {/* Ảnh */}
        <Section title="Ảnh sản phẩm" hint="Ảnh 1: mặt trước, Ảnh 2: mặt sau (dùng cho hover)">
          <div className="space-y-2">
            {form.images.map((img, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className="input-base flex-1"
                  value={img}
                  onChange={(e) => updateImage(i, e.target.value)}
                  placeholder={`URL ảnh ${i + 1}`}
                />
                {form.images.length > 1 && (
                  <button type="button" onClick={() => removeImageField(i)} className="p-2.5 text-gray-400 hover:text-red-500 transition-colors border border-gray-200">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addImageField} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors">
              <Plus size={15} /> Thêm ảnh
            </button>
          </div>
        </Section>

        {/* Biến thể - Phần quan trọng nhất */}
        <Section title="Biến thể sản phẩm (Size / Màu / Tồn kho)">
          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase tracking-wide px-1">
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Màu sắc</div>
              <div className="col-span-2">Mã màu</div>
              <div className="col-span-2">SKU</div>
              <div className="col-span-1">Tồn kho</div>
              <div className="col-span-2">Giá riêng (₫)</div>
              <div className="col-span-1"></div>
            </div>

            {form.variants.map((v, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded">
                <div className="col-span-2">
                  <select className="input-base text-sm py-2" value={v.size} onChange={(e) => updateVariant(i, 'size', e.target.value)}>
                    {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <input className="input-base text-sm py-2" value={v.color} onChange={(e) => updateVariant(i, 'color', e.target.value)} placeholder="Đen, Trắng..." required />
                </div>
                <div className="col-span-2 flex gap-1 items-center">
                  <input type="color" value={v.colorHex} onChange={(e) => updateVariant(i, 'colorHex', e.target.value)} className="w-8 h-9 border border-gray-200 cursor-pointer p-0.5" />
                  <input className="input-base text-sm py-2 flex-1" value={v.colorHex} onChange={(e) => updateVariant(i, 'colorHex', e.target.value)} placeholder="#000000" />
                </div>
                <div className="col-span-2">
                  <input className="input-base text-sm py-2" value={v.sku} onChange={(e) => updateVariant(i, 'sku', e.target.value)} placeholder="BOBO-M-BLK" />
                </div>
                <div className="col-span-1">
                  <input type="number" className="input-base text-sm py-2" value={v.stock} onChange={(e) => updateVariant(i, 'stock', e.target.value)} min="0" required />
                </div>
                <div className="col-span-2">
                  <input type="number" className="input-base text-sm py-2" value={v.priceOverride} onChange={(e) => updateVariant(i, 'priceOverride', e.target.value)} placeholder="Bỏ trống = dùng giá gốc" min="0" />
                </div>
                <div className="col-span-1 flex justify-center">
                  {form.variants.length > 1 && (
                    <button type="button" onClick={() => removeVariant(i)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button type="button" onClick={addVariant} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors mt-1">
              <Plus size={15} /> Thêm biến thể
            </button>
          </div>
        </Section>

        {/* Thêm nữa */}
        <Section title="Thông tin bổ sung">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Chất liệu">
              <input className="input-base" value={form.material} onChange={(e) => updateField('material', e.target.value)} placeholder="Cotton 100%, Linen..." />
            </Field>
          </div>
          <div className="flex gap-6 mt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} className="w-4 h-4 accent-gray-900" />
              <span className="text-sm font-medium">Đang bán (hiển thị trên website)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => updateField('isFeatured', e.target.checked)} className="w-4 h-4 accent-gray-900" />
              <span className="text-sm font-medium">Sản phẩm nổi bật</span>
            </label>
          </div>
        </Section>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-bobo-black text-white px-6 py-3 font-medium hover:bg-gray-800 transition-colors disabled:opacity-60">
            <Save size={18} />
            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
          </button>
          <button type="button" onClick={() => navigate('/admin/products')} className="px-6 py-3 border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors">
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
};

// Sub-components
const Section = ({ title, hint, children }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="mb-4">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
    </div>
    {children}
  </div>
);

const Field = ({ label, hint, children, className = '' }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label}
      {hint && <span className="font-normal text-gray-400 ml-1">— {hint}</span>}
    </label>
    {children}
  </div>
);

export default ProductFormPage;
