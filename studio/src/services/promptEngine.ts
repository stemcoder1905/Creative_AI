// src/services/promptEngine.ts
import { DesignBrief, Profile } from '@/types';

/**
 * Transforms user briefs into rich, highly detailed, visually stunning prompts
 * with explicit rendering of festive elements, typography, and vibrant backgrounds.
 */
export function buildPrompt(brief: DesignBrief, profile: Profile): string {
  const brandName = profile.business_name || profile.full_name || '';
  const profession = profile.profession || '';
  const brandPalette = profile.brand_colors ?? profile.brandColors ?? null;
  const colors = brief.colorPalette ||
    (Array.isArray(brandPalette) ? brandPalette.join(', ') : brandPalette) ||
    'golden warm glow, festive deep amber, radiant purple';

  const userTopic = brief.topic.trim();
  const headline = brief.headline ? `Featured bold typographic headline: "${brief.headline}".` : '';
  const cta = brief.cta ? `Call to action text ribbon: "${brief.cta}".` : '';

  let sceneDetails = '';

  if (brief.designType === 'Motivational Quote') {
    sceneDetails = `An inspiring motivational poster about "${userTopic}". Inspiring positive quote about inner light conquering darkness, radiant glowing oil lamps (diyas), spiritual golden sparks, blooming marigold flowers, elegant Hindi/English calligraphy typography, festive celebration atmosphere.`;
  } else if (brief.designType === 'Festival & Holiday Greeting') {
    sceneDetails = `A glorious festive celebration greeting poster for "${userTopic}". Decorated clay diyas glowing warmly with golden flames, intricate colorful rangoli patterns, floating golden sparkles and fireworks in night sky, warm celebratory ambiance, festive greeting poster.`;
  } else if (brief.designType === 'Special Offer & Discount Ad') {
    sceneDetails = `Eye-catching promotional discount advertising banner for "${userTopic}". Bold 3D typography showing discount offer, glowing festive ornaments, high-energy modern sale banner, commercial product placement pedestal.`;
  } else if (brief.designType === 'Product Showcase') {
    sceneDetails = `Commercial luxury product display poster for "${userTopic}". Pristine marble display podium surrounded by festive golden lights, delicate flowers, studio reflection lighting, high-end catalog presentation.`;
  } else {
    sceneDetails = `Commercial social media banner and poster for "${userTopic}". ${profession ? `Tailored for ${profession}.` : ''} Professional marketing layout, bold visual focal point, artistic festival motifs, warm lighting.`;
  }

  const prompt = `${sceneDetails} ${headline} ${cta} Visual Style: ${brief.style}, hyper-detailed graphic design, commercial social media poster for ${brief.platform.replace('_', ' ')}, vibrant harmonious color palette (${colors}), ultra-high resolution 8k, award-winning poster design, clean artistic presentation.`;

  return prompt;
}
