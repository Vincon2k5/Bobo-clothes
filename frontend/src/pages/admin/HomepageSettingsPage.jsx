import { useEffect, useState } from 'react';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';

const HomepageSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    heroImage: '',
    heroTitle: '',
    heroSubtitle: '',
    categoryTiles: [], // [{label, img, to}]
    featuredProductIds: [],
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminApi.getSiteHomepage();
        setForm((prev) => ({ ...prev, ...(res.data || {}) }));
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateField = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const handleSave = async () => {
    try {
      await adminApi.updateSiteHomepage(form);
      toast.success('Lưu cấu hình thành công');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cấu hình Trang Chủ</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-white border rounded">
          <label className="block text-sm font-medium mb-2">Hero Image (URL)</label>
          <input type="text" value={form.heroImage || ''} onChange={(e) => updateField('heroImage', e.target.value)} className="input-base w-full" />
          <label className="block text-sm font-medium mt-3 mb-2">Hero Title</label>
          <input type="text" value={form.heroTitle || ''} onChange={(e) => updateField('heroTitle', e.target.value)} className="input-base w-full" />
          <label className="block text-sm font-medium mt-3 mb-2">Hero Subtitle</label>
          <input type="text" value={form.heroSubtitle || ''} onChange={(e) => updateField('heroSubtitle', e.target.value)} className="input-base w-full" />
        </div>

        <div className="p-4 bg-white border rounded">
          <label className="block text-sm font-medium mb-2">Featured Product IDs (comma separated)</label>
          <input type="text" value={(form.featuredProductIds || []).join(',')} onChange={(e) => updateField('featuredProductIds', e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} className="input-base w-full" />
          <p className="text-xs text-gray-500 mt-2">Bạn có thể dán list product IDs từ trang Products (admin)</p>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleSave} className="btn-primary">Lưu</button>
      </div>
    </div>
  );
};

export default HomepageSettingsPage;
