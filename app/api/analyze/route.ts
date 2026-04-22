import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { scrapeAds } from '../../../lib/scrapeAds.js'

export const runtime = 'nodejs'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      competitorName,
      comparisonBrand,
      adSource,
      comparisonAdSource,
      ads = [],
    } = body

    const scrapedAds = adSource ? await scrapeAds(adSource) : []
    const comparisonAds = comparisonAdSource ? await scrapeAds(comparisonAdSource) : []

    const adsToAnalyze = scrapedAds.length > 0 ? scrapedAds : ads || []

    const formattedAds = adsToAnalyze
      .map((ad: any, index: number) => {
        return `
Ad ${index + 1}
Brand: ${ad.brand}
Copy: ${ad.copy}
CTA: ${ad.cta}
Has Image: ${ad.image ? 'Yes' : 'No'}
Has Video: ${ad.hasVideo ? 'Yes' : 'No'}
Visual Type: ${
          ad.hasVideo
            ? 'Video'
            : ad.copy?.toLowerCase().includes('business')
            ? 'Office Scene'
            : ad.copy?.toLowerCase().includes('mobile')
            ? 'Lifestyle Usage'
            : 'Product Shot'
        }
`
      })
      .join('\n\n')

    const formattedComparisonAds = comparisonAds
      .map((ad: any, index: number) => {
        return `
Comparison Ad ${index + 1}
Brand: ${ad.brand}
Copy: ${ad.copy}
CTA: ${ad.cta}
Has Image: ${ad.image ? 'Yes' : 'No'}
Has Video: ${ad.hasVideo ? 'Yes' : 'No'}
Visual Type: ${
          ad.hasVideo
            ? 'Video'
            : ad.copy?.toLowerCase().includes('business')
            ? 'Office Scene'
            : ad.copy?.toLowerCase().includes('mobile')
            ? 'Lifestyle Usage'
            : 'Product Shot'
        }
`
      })
      .join('\n\n')

    const prompt = `
You are a senior performance marketer.

Analyze ONLY the ad copy and visual patterns provided below.

Be literal and evidence-based.

Do not invent offers, discounts, CTAs, emotional themes, or visual styles that are not explicitly present in the ads.

If a pattern appears only once, do not describe it as a dominant theme.

When comparing the two brands:

Identify what Brand A clearly owns
Identify what Brand B clearly owns
Highlight repeated CTAs, hooks, and visual styles
Identify where both brands sound similar
Identify where one brand is stronger than the other
Identify opportunities that neither brand is using
Be concise and direct
Avoid vague statements like "premium feel" unless supported by the ads
If no clear pattern exists, explicitly say so

Competitor: ${competitorName}
Comparison Brand: ${comparisonBrand || 'None'}

Primary Competitor Ads:
${formattedAds}

${
      formattedComparisonAds
        ? `
Comparison Brand Ads:
${formattedComparisonAds}
`
        : ''
    }

Return output in exactly this format:

Top Hooks:
- ...
- ...
- ...

Offer Patterns:
- ...
- ...
- ...

Emotional Angles:
- ...
- ...
- ...

Saturated Messaging:
- ...
- ...
- ...

Missing Opportunities:
- ...
- ...
- ...

Visual Patterns:
- ...
- ...

Creative Fatigue Risk:
...

Recommended Next Angles:
- ...
- ...

Brand Comparison:

Competitor Strengths:

* ...
* ...
* ...

Comparison Brand Strengths:

* ...
* ...
* ...

Shared Weaknesses:

* ...
* ...
* ...

White Space Opportunities:

* ...
* ...
* ...

CTA Comparison:

* ...
* ...

Visual Style Comparison:

* ...
* ...

Gap-Driven Creative Concepts:

1. Territory: ...
   Hook: ...
   Visual: ...
   CTA: ...

2. Territory: ...
   Hook: ...
   Visual: ...
   CTA: ...

3. Territory: ...
   Hook: ...
   Visual: ...
   CTA: ...


Ad Brief Ideas:

1. Hook: ...
Visual: ...
CTA: ...

2. Hook: ...
Visual: ...
CTA: ...

3. Hook: ...
Visual: ...
CTA: ...
`

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
    })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 20,
        maxOutputTokens: 2500,
      },
    })

    const responseText = result.response.text()

    return NextResponse.json({
      result: responseText,
      scrapedAds,
      comparisonAds,
    })
  } catch (error: any) {
    console.error('API Route Error:', error)

    return NextResponse.json(
      { error: error.message || 'Unknown error' },
      { status: 500 }
    )
  }
}