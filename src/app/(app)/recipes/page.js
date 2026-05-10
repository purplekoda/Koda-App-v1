import { requireUser } from '@/lib/dal/require-user';
import { getUserRecipes } from '@/lib/dal/recipes';
import { getUserCollections, getRecipeCollectionLinks } from '@/lib/dal/collections';
import { getHouseholdFaithPractices } from '@/lib/dal/faith-practices';
import { getRecipeCardSettings } from '@/lib/dal/profile';
import RecipesPageClient from './RecipesPageClient';

export default async function RecipesPage() {
  const user = await requireUser();

  let recipes = [];
  let faithPractices = { follows_faith_based_diet: false };
  let cardSettings = null;
  let collections = [];
  let collectionLinks = [];
  try {
    [recipes, faithPractices, cardSettings, collections, collectionLinks] = await Promise.all([
      getUserRecipes(user.id),
      getHouseholdFaithPractices(user.id).catch(() => ({ follows_faith_based_diet: false })),
      getRecipeCardSettings(user.id).catch(() => null),
      getUserCollections(user.id).catch(() => []),
      getRecipeCollectionLinks(user.id).catch(() => []),
    ]);
  } catch (err) {
    console.error('[RecipesPage] Failed to load recipes:', err?.message);
  }

  return (
    <RecipesPageClient
      initialRecipes={recipes}
      faithPractices={faithPractices}
      cardSettings={cardSettings}
      initialCollections={collections}
      initialCollectionLinks={collectionLinks}
    />
  );
}
