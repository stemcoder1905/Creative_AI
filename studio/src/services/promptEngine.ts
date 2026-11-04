// src/services/promptEngine.ts
import { DesignBrief, Profile } from '@/types';

/**
 * Transforms user briefs into rich, highly detailed, visually stunning prompts
 * with explicit rendering of festive elements, typography, and vibrant backgrounds.
 */
export function buildPrompt(brief: DesignBrief, profile: Profile): string {
  const currentYear = new Date().getFullYear();
  const rawBrand = profile.business_name || profile.full_name || '';
  const brandName = /my\s*space/i.test(rawBrand) ? '' : rawBrand;
  const profession = profile.profession || '';
  const brandPalette = profile.brand_colors ?? profile.brandColors ?? null;
  const colors = brief.colorPalette ||
    (Array.isArray(brandPalette) ? brandPalette.join(', ') : brandPalette) ||
    'golden warm glow, festive deep amber, radiant purple';

  const userTopic = brief.topic.trim();
  const headline = brief.headline ? `Featured bold typography headline: "${brief.headline}".` : '';
  const cta = brief.cta ? `Call to action text ribbon: "${brief.cta}".` : '';

  let sceneDetails = '';

  if (brief.designType === 'Motivational Quote') {
    sceneDetails = `An inspiring motivational poster about "${userTopic}". Inspiring positive quote about inner light conquering darkness, radiant glowing oil lamps (diyas), spiritual golden sparks, blooming marigold flowers, elegant typography, festive celebration atmosphere.`;
  } else if (brief.designType === 'Festival & Holiday Greeting') {
    sceneDetails = `A glorious festive celebration greeting poster for "${userTopic}". Decorated clay diyas glowing warmly with golden flames, intricate colorful rangoli patterns, floating golden sparkles and fireworks in night sky, warm celebratory ambiance, festive celebration poster.`;
  } else if (brief.designType === 'Special Offer & Discount Ad') {
    sceneDetails = `Eye-catching promotional discount advertising poster for "${userTopic}". Bold 3D typography showing discount offer, glowing festive ornaments, high-energy modern sale graphic, commercial product presentation.`;
  } else if (brief.designType === 'Product Showcase') {
    sceneDetails = `Commercial luxury product display poster for "${userTopic}". Pristine marble display podium surrounded by festive golden lights, delicate flowers, studio reflection lighting, high-end presentation.`;
  } else {
    sceneDetails = `Commercial poster and visual artwork for "${userTopic}". ${profession ? `Tailored for ${profession}.` : ''} Professional marketing layout, bold visual focal point, artistic motifs, warm lighting.`;
  }

  // Handle contact info / handle:
  let contactInstruction = '';
  const explicitContact = brief.contactInfo?.trim();
  if (explicitContact) {
    contactInstruction = `Include the exact contact info or handle: "${explicitContact}".`;
  } else {
    contactInstruction = `STRICT TEXT AND UI PROHIBITIONS:
- Absolutely DO NOT generate or render any text containing "Follow", "Follow @...", "@YourHandle", "@YourUsername", "@username", "@handle", or any placeholder username.
- Absolutely DO NOT draw or include any social media UI elements (heart icons, comment badges, share icons, follow buttons, or notification ribbons).
- No simulated social media app UI or mockups. Render only clean, cinematic poster artwork.`;
  }

  const prompt = `${sceneDetails} ${headline} ${cta} ${contactInstruction} Year: ${currentYear}. Visual Style: ${brief.style}, hyper-detailed graphic design, commercial poster artwork, vibrant harmonious color palette (${colors}), ultra-high resolution 8k, clean artistic presentation, no watermarks, no placeholder handles, no fake follow text.`;

  return prompt;
}
