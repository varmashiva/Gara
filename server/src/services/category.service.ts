import { Category } from '../models/Category';
import { AppError } from '../utils/errors';
import { slugify } from '../utils/slugify';
import { CreateCategoryInput, UpdateCategoryInput } from '../schemas/category.schema';

export async function listCategories() {
  return Category.find({ isActive: true, isDeleted: false }).sort({ name: 1 }).lean();
}

export async function createCategory(input: CreateCategoryInput) {
  const slug = slugify(input.name);
  const exists = await Category.exists({ slug });
  if (exists) {
    throw AppError.conflict('A category with this name already exists', 'CATEGORY_EXISTS');
  }
  return Category.create({ ...input, slug });
}

async function findActiveCategory(id: string) {
  const category = await Category.findOne({ _id: id, isDeleted: false });
  if (!category) {
    throw AppError.notFound('Category not found', 'CATEGORY_NOT_FOUND');
  }
  return category;
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  const category = await findActiveCategory(id);
  Object.assign(category, input);
  await category.save();
  return category;
}

export async function softDeleteCategory(id: string, adminUserId: string) {
  const category = await findActiveCategory(id);
  category.isDeleted = true;
  category.deletedAt = new Date();
  category.deletedBy = adminUserId as unknown as typeof category.deletedBy;
  category.isActive = false;
  await category.save();
}
