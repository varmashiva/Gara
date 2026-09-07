import { User } from '../models/User';
import { Seller } from '../models/Seller';
import { SellerApplication } from '../models/SellerApplication';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { hashPassword } from '../utils/password';
import { slugify } from '../utils/slugify';
import { logger } from '../utils/logger';
import { env } from './env';

const DEV_ADMIN_EMAIL = 'admin@example.com';
const DEV_ADMIN_PASSWORD = 'DevAdmin123!';
const DEV_SELLER_EMAIL = 'seller@example.com';
const DEV_SELLER_PASSWORD = 'DevSeller123!';
const DEV_CUSTOMER_EMAIL = 'customer@example.com';
const DEV_CUSTOMER_PASSWORD = 'DevCustomer123!';

/**
 * Development-only convenience: without this there is no way to reach any
 * /api/v1/admin/* route on a fresh database, since ADMIN is never a
 * self-assignable registration role. Real seed data (Section 51/52 of the
 * design doc) is a later phase — this only bootstraps the one account
 * needed to test admin flows locally.
 */
export async function seedDevAdmin() {
  const existingAdmin = await User.findOne({ role: 'ADMIN' });
  if (existingAdmin) return;

  const passwordHash = await hashPassword(DEV_ADMIN_PASSWORD);
  await User.create({
    username: 'admin',
    email: DEV_ADMIN_EMAIL,
    passwordHash,
    role: 'ADMIN',
    firstName: 'Dev',
    lastName: 'Admin',
    isEmailVerified: true,
  });

  logger.info('Seeded development-only admin account', {
    email: DEV_ADMIN_EMAIL,
    password: DEV_ADMIN_PASSWORD,
    note: 'development only — never used in production',
  });
}

export async function seedDevCustomer() {
  const existing = await User.findOne({ email: DEV_CUSTOMER_EMAIL });
  if (existing) return;

  const passwordHash = await hashPassword(DEV_CUSTOMER_PASSWORD);
  await User.create({
    username: 'customer',
    email: DEV_CUSTOMER_EMAIL,
    passwordHash,
    role: 'CUSTOMER',
    firstName: 'Dev',
    lastName: 'Customer',
    isEmailVerified: true,
  });

  logger.info('Seeded development-only customer account', {
    email: DEV_CUSTOMER_EMAIL,
    password: DEV_CUSTOMER_PASSWORD,
    note: 'development only — never used in production',
  });
}

/**
 * Populates a fresh dev database with one approved seller and a handful of
 * approved products, so the frontend has something real to render without
 * a manual curl setup dance every time the (in-memory, ephemeral) dev DB
 * restarts. Skips entirely if any product already exists.
 */
export async function seedDevCatalog() {
  const anyProduct = await Product.findOne();
  if (anyProduct) return;

  const passwordHash = await hashPassword(DEV_SELLER_PASSWORD);
  const sellerUser = await User.create({
    username: 'seller',
    email: DEV_SELLER_EMAIL,
    passwordHash,
    role: 'SELLER',
    firstName: 'Dev',
    lastName: 'Seller',
    isEmailVerified: true,
  });

  const application = await SellerApplication.create({
    userId: sellerUser._id,
    storeName: 'Amma Kitchen',
    ownerName: 'Dev Seller',
    phone: '9000000000',
    email: DEV_SELLER_EMAIL,
    address: {
      addressLine1: '1 MG Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      country: 'India',
    },
    description: 'Homemade South Indian pickles, snacks, and sweets.',
    foodCategories: ['pickles', 'snacks', 'sweets'],
    status: 'APPROVED',
    reviewNotes: 'Seeded for local development',
  });

  const seller = await Seller.create({
    userId: sellerUser._id,
    storeName: application.storeName,
    storeSlug: slugify(application.storeName),
    description: application.description,
    foodCategories: application.foodCategories,
    status: 'APPROVED',
    commissionRate: env.DEFAULT_COMMISSION_RATE_BPS,
    applicationId: application._id,
  });

  const categoryDefs = [
    { name: 'Pickles', icon: '🥒' },
    { name: 'Sweets', icon: '🍬' },
    { name: 'Snacks', icon: '🍿' },
  ];
  const categories = await Category.insertMany(
    categoryDefs.map((c) => ({ name: c.name, slug: slugify(c.name), icon: c.icon }))
  );
  const [pickles, sweets, snacks] = categories;

  const productDefs = [
    {
      category: pickles,
      name: 'Mango Pickle',
      description: 'Traditional spicy raw mango pickle made in small batches.',
      price: 29900,
      isVeg: true,
      stock: 25,
      ingredients: ['Raw mango', 'Mustard oil', 'Red chilli', 'Fenugreek'],
      allergens: ['Mustard'],
    },
    {
      category: pickles,
      name: 'Lemon Pickle',
      description: 'Tangy homemade lemon pickle with a hint of jaggery.',
      price: 24900,
      isVeg: true,
      stock: 30,
      ingredients: ['Lemon', 'Jaggery', 'Red chilli', 'Salt'],
      allergens: [],
    },
    {
      category: sweets,
      name: 'Coconut Laddu',
      description: 'Soft coconut and condensed milk laddus.',
      price: 34900,
      isVeg: true,
      stock: 15,
      ingredients: ['Coconut', 'Condensed milk', 'Cardamom'],
      allergens: ['Milk'],
    },
    {
      category: sweets,
      name: 'Motichoor Laddu',
      description: 'Classic festive motichoor laddu, made fresh to order.',
      price: 39900,
      isVeg: true,
      stock: 12,
      ingredients: ['Gram flour', 'Ghee', 'Sugar', 'Saffron'],
      allergens: ['Milk'],
    },
    {
      category: snacks,
      name: 'Murukku',
      description: 'Crispy rice-flour murukku, a South Indian tea-time favourite.',
      price: 19900,
      isVeg: true,
      stock: 40,
      ingredients: ['Rice flour', 'Urad dal', 'Sesame seeds'],
      allergens: ['Sesame'],
    },
    {
      category: snacks,
      name: 'Chicken Cutlet',
      description: 'Home-style spiced chicken cutlets, shallow fried.',
      price: 44900,
      isVeg: false,
      stock: 10,
      ingredients: ['Chicken', 'Potato', 'Bread crumbs', 'Spices'],
      allergens: ['Gluten'],
    },
  ];

  for (const def of productDefs) {
    const slug = slugify(def.name);
    await Product.create({
      sellerId: seller._id,
      categoryId: def.category._id,
      categorySnapshot: { name: def.category.name, slug: def.category.slug },
      name: def.name,
      slug,
      description: def.description,
      images: [
        {
          url: `https://picsum.photos/seed/${slug}/480/360`,
          publicId: `seed-${slug}`,
          alt: def.name,
          order: 0,
        },
      ],
      price: def.price,
      isVeg: def.isVeg,
      ingredients: def.ingredients,
      allergens: def.allergens,
      shelfLifeDays: 30,
      storageInstructions: 'Store in a cool, dry place. Refrigerate after opening.',
      inventory: { availableStock: def.stock, reservedStock: 0, lowStockThreshold: 5 },
      status: 'APPROVED',
    });
  }

  logger.info('Seeded development catalog', {
    seller: DEV_SELLER_EMAIL,
    sellerPassword: DEV_SELLER_PASSWORD,
    products: productDefs.length,
    note: 'development only',
  });
}
