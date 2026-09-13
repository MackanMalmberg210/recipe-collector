import type { Metadata } from "next";
import RecipePageClient from "./RecipePageClient";
import { getRecipeById } from "../../../lib/recipes";
import type { AppRecipe } from "../../../lib/types";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

// Dynamic OpenGraph and Twitter Metadata for Social Sharing (WhatsApp, iMessage, Social Media)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const recipeId = Number(resolvedParams.id);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://recipecollector.app";

  if (Number.isNaN(recipeId)) {
    return {
      title: "Recipe Not Found • Recipe Collector",
      description: "Culinary recipe not found.",
    };
  }

  const recipe = await getRecipeById(recipeId);

  if (!recipe) {
    return {
      title: "Recipe Not Found • Recipe Collector",
      description: "A culinary recipe on Recipe Collector.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  // Private or quarantined recipes must NEVER be indexed or shared publicly
  if (!recipe.isPublic || recipe.isQuarantined) {
    return {
      title: `${recipe.title} • Recipe Collector`,
      description: "A private recipe on Recipe Collector.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description =
    recipe.description ||
    `Cook ${recipe.title} with step-by-step instructions, ingredient checklists, and nutrition facts on Recipe Collector.`;

  const imageUrl = recipe.image || `${baseUrl}/icons/icon-512x512.png`;

  return {
    title: recipe.title,
    description,
    openGraph: {
      title: `${recipe.title} • Recipe Collector`,
      description,
      url: `${baseUrl}/recipes/${recipe.id}`,
      siteName: "Recipe Collector",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: recipe.title,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: `${recipe.title} • Recipe Collector`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function RecipePage({ params }: Props) {
  const resolvedParams = await params;
  const recipeId = Number(resolvedParams.id);
  const recipe: AppRecipe | null = !Number.isNaN(recipeId) ? await getRecipeById(recipeId) : null;

  // Build Schema.org/Recipe JSON-LD for rich Google search cards (ONLY for public, non-quarantined recipes)
  const schemaJsonLd = recipe && recipe.isPublic && !recipe.isQuarantined
    ? {
        "@context": "https://schema.org",
        "@type": "Recipe",
        name: recipe.title,
        description:
          recipe.description ||
          `Step-by-step recipe for ${recipe.title} on Recipe Collector.`,
        image: recipe.image ? [recipe.image] : undefined,
        author: {
          "@type": "Person",
          name: recipe.authorName || "Recipe Collector Chef",
        },
        recipeYield: recipe.servings ? `${recipe.servings} servings` : undefined,
        cookTime: recipe.cookTime ? `PT${recipe.cookTime}M` : undefined,
        totalTime: recipe.cookTime ? `PT${recipe.cookTime}M` : undefined,
        recipeCategory: recipe.category || "Main Course",
        keywords: recipe.tags?.join(", "),
        recipeIngredient: recipe.ingredients,
        recipeInstructions: recipe.instructions?.map((instruction, index) => ({
          "@type": "HowToStep",
          position: index + 1,
          text: instruction,
        })),
        ...(recipe.calories
          ? {
              nutrition: {
                "@type": "NutritionInformation",
                calories: `${recipe.calories} calories`,
              },
            }
          : {}),
      }
    : null;

  return (
    <>
      {schemaJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
        />
      )}
      <RecipePageClient recipeId={recipeId} initialRecipe={recipe} />
    </>
  );
}
