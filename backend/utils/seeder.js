/**
 * Seeder: Tạo dữ liệu mẫu cho DB
 * Chạy: npm run seed
 * Xóa và seed lại: npm run seed -- --destroy
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Product = require('../models/Product');

const sampleProducts = [
  {
    name: 'Áo Thun BoBo Classic Trắng',
    slug: 'ao-thun-bobo-classic-trang',
    description: 'Áo thun cotton 100% cao cấp, form regular fit thoáng mát. Phù hợp mặc hàng ngày hoặc phối cùng quần jean.',
    shortDescription: 'Cotton 100% | Form Regular | Mặc ngày hàng ngày',
    images: [
      'https://via.placeholder.com/600x800?text=BoBo+Classic+Front',
      'https://via.placeholder.com/600x800?text=BoBo+Classic+Back',
    ],
    category: 'ao',
    subCategory: 'ao-thun',
    tags: ['new-arrival', 'best-seller', 'basic'],
    basePrice: 299000,
    material: 'Cotton 100%',
    careInstructions: ['Giặt tay hoặc máy ≤ 30°C', 'Không dùng máy sấy', 'Ủi nhiệt độ thấp'],
    variants: [
      { size: 'S', color: 'Trắng', colorHex: '#FFFFFF', sku: 'BOBO-CLASSIC-S-WHITE', stock: 50 },
      { size: 'M', color: 'Trắng', colorHex: '#FFFFFF', sku: 'BOBO-CLASSIC-M-WHITE', stock: 80 },
      { size: 'L', color: 'Trắng', colorHex: '#FFFFFF', sku: 'BOBO-CLASSIC-L-WHITE', stock: 60 },
      { size: 'XL', color: 'Trắng', colorHex: '#FFFFFF', sku: 'BOBO-CLASSIC-XL-WHITE', stock: 40 },
      { size: 'S', color: 'Đen', colorHex: '#1A1A1A', sku: 'BOBO-CLASSIC-S-BLACK', stock: 45 },
      { size: 'M', color: 'Đen', colorHex: '#1A1A1A', sku: 'BOBO-CLASSIC-M-BLACK', stock: 70 },
      { size: 'L', color: 'Đen', colorHex: '#1A1A1A', sku: 'BOBO-CLASSIC-L-BLACK', stock: 55 },
    ],
    rating: { average: 4.8, count: 234 },
    soldCount: 1250,
    isFeatured: true,
    isActive: true,
  },
  {
    name: 'Quần Jean BoBo Slim Fit',
    slug: 'quan-jean-bobo-slim-fit',
    description: 'Quần jean denim cao cấp, co giãn 4 chiều, form slim fit tôn dáng. Wash nhẹ, phong cách casual hiện đại.',
    shortDescription: 'Denim co giãn | Form Slim | Wash Light',
    images: [
      'https://via.placeholder.com/600x800?text=BoBo+Jean+Front',
      'https://via.placeholder.com/600x800?text=BoBo+Jean+Back',
    ],
    category: 'quan',
    subCategory: 'quan-jean',
    tags: ['best-seller', 'casual'],
    basePrice: 599000,
    salePrice: 499000,
    discountPercent: 17,
    material: 'Denim cotton 98%, Spandex 2%',
    variants: [
      { size: 'S', color: 'Light Blue', colorHex: '#ADD8E6', sku: 'BOBO-JEAN-S-LB', stock: 30 },
      { size: 'M', color: 'Light Blue', colorHex: '#ADD8E6', sku: 'BOBO-JEAN-M-LB', stock: 45 },
      { size: 'L', color: 'Light Blue', colorHex: '#ADD8E6', sku: 'BOBO-JEAN-L-LB', stock: 35 },
      { size: 'XL', color: 'Light Blue', colorHex: '#ADD8E6', sku: 'BOBO-JEAN-XL-LB', stock: 20 },
      { size: 'M', color: 'Dark Blue', colorHex: '#00008B', sku: 'BOBO-JEAN-M-DB', stock: 40 },
      { size: 'L', color: 'Dark Blue', colorHex: '#00008B', sku: 'BOBO-JEAN-L-DB', stock: 30 },
    ],
    rating: { average: 4.6, count: 189 },
    soldCount: 890,
    isFeatured: true,
    isActive: true,
  },
  {
    name: 'Váy BoBo Floral Summer',
    slug: 'vay-bobo-floral-summer',
    description: 'Váy maxi hoa nhẹ nhàng, chất liệu voan mềm mại. Thiết kế phóng khoáng, phù hợp đi biển hoặc dạo phố mùa hè.',
    shortDescription: 'Voan mềm mại | Form Maxi | In hoa',
    images: [
      'https://via.placeholder.com/600x800?text=BoBo+Floral+Front',
      'https://via.placeholder.com/600x800?text=BoBo+Floral+Side',
    ],
    category: 'vay',
    subCategory: 'vay-maxi',
    tags: ['new-arrival', 'summer-2025', 'trending'],
    basePrice: 450000,
    material: 'Voan Polyester cao cấp',
    variants: [
      { size: 'S', color: 'Hồng Pastel', colorHex: '#FFB6C1', sku: 'BOBO-FLORAL-S-PINK', stock: 25 },
      { size: 'M', color: 'Hồng Pastel', colorHex: '#FFB6C1', sku: 'BOBO-FLORAL-M-PINK', stock: 35 },
      { size: 'L', color: 'Hồng Pastel', colorHex: '#FFB6C1', sku: 'BOBO-FLORAL-L-PINK', stock: 20 },
      { size: 'S', color: 'Xanh Pastel', colorHex: '#AEC6CF', sku: 'BOBO-FLORAL-S-BLUE', stock: 20 },
      { size: 'M', color: 'Xanh Pastel', colorHex: '#AEC6CF', sku: 'BOBO-FLORAL-M-BLUE', stock: 30 },
    ],
    rating: { average: 4.9, count: 67 },
    soldCount: 320,
    isFeatured: false,
    isActive: true,
  },
  {
    name: 'Túi Xách BoBo Tote Canvas',
    slug: 'tui-xach-bobo-tote-canvas',
    description: 'Túi tote canvas dày dặn, in logo BoBo tối giản. Dung tích lớn, phù hợp đi học, đi chơi hay mua sắm.',
    shortDescription: 'Canvas cao cấp | Logo BoBo | Đa năng',
    images: [
      'https://via.placeholder.com/600x800?text=BoBo+Tote+Front',
    ],
    category: 'phu-kien',
    subCategory: 'tui-xach',
    tags: ['best-seller', 'phụ kiện'],
    basePrice: 199000,
    variants: [
      { size: 'ONE SIZE', color: 'Kem', colorHex: '#FFFDD0', sku: 'BOBO-TOTE-OS-CREAM', stock: 100 },
      { size: 'ONE SIZE', color: 'Đen', colorHex: '#1A1A1A', sku: 'BOBO-TOTE-OS-BLACK', stock: 80 },
      { size: 'ONE SIZE', color: 'Navy', colorHex: '#000080', sku: 'BOBO-TOTE-OS-NAVY', stock: 60 },
    ],
    rating: { average: 4.7, count: 445 },
    soldCount: 2100,
    isFeatured: true,
    isActive: true,
  },
];

const seedData = async () => {
  try {
    await connectDB();

    const destroyFlag = process.argv.includes('--destroy');

    if (destroyFlag) {
      await Product.deleteMany({});
      console.log('🗑️  Đã xóa tất cả sản phẩm');
      process.exit(0);
    }

    // Xóa data cũ và seed lại
    await Product.deleteMany({});
    await Product.insertMany(sampleProducts);

    console.log(`✅ Đã seed ${sampleProducts.length} sản phẩm mẫu thành công!`);
    console.log('📦 Sản phẩm đã tạo:');
    sampleProducts.forEach(p => console.log(`   - ${p.name} (${p.slug})`));

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed thất bại:', error);
    process.exit(1);
  }
};

seedData();
