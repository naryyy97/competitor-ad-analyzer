import { chromium } from 'playwright'
import chromiumPack from '@sparticuz/chromium'

async function toBase64(url) {
  if (!url) return null
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.facebook.com/',
      },
    })
    if (!res.ok) return null
    const buffer = await res.arrayBuffer()
    if (buffer.byteLength > 500_000) return null
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const base64 = Buffer.from(buffer).toString('base64')
    return `data:${contentType};base64,${base64}`
  } catch {
    return null
  }
}

export async function scrapeAds(url) {
  const safeUrl = String(url).trim()
  console.log('Scraping URL:', safeUrl)

  if (!safeUrl || !safeUrl.startsWith('http')) {
    throw new Error(`Invalid URL: ${safeUrl}`)
  }

  let browser

   if (process.env.VERCEL) {
    browser = await chromium.launch({
    args: chromiumPack.args,
    executablePath: await chromiumPack.executablePath(),
    headless: true,
    })
   } else {
    const { chromium: localChromium } = await import('playwright')

    browser = await localChromium.launch({
    headless: true,
    })
  }


  const page = await browser.newPage({
    viewport: { width: 1440, height: 2200 },
  })

  // Intercept and capture video URLs from network traffic
  const capturedVideoUrls = new Map()

  page.on('response', async (response) => {
    const respUrl = response.url()
    const contentType = response.headers()['content-type'] || ''

    if (
      contentType.includes('video') ||
      (respUrl.includes('.mp4') || (respUrl.includes('video') && respUrl.includes('fbcdn')))
    ) {
      const key = respUrl.split('?')[0].split('/').pop() || respUrl
      capturedVideoUrls.set(key, respUrl)
      console.log('Captured video URL:', respUrl.slice(0, 80))
    }
  })

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-CA,en;q=0.9',
  })

  await page.goto(safeUrl, {
    waitUntil: 'domcontentloaded',
    timeout: 120000,
  })

  await page.waitForTimeout(15000)

  // Trigger lazy loading
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight / 2)
  })

  await page.waitForTimeout(5000)

  // Scroll every card into view
  await page.evaluate(() => {
    Array.from(document.querySelectorAll('div')).forEach((card) => {
      card.scrollIntoView({ behavior: 'instant', block: 'center' })
    })
  })

  await page.waitForTimeout(3000)

  // Trigger video loads by hovering and attempting play
  await page.evaluate(async () => {
    const videos = Array.from(document.querySelectorAll('video'))
    for (const video of videos) {
      video.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
      video.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      video.muted = true
      video.play().catch(() => {})
    }
  })

  await page.waitForTimeout(5000)

  const data = await page.evaluate(() => {
    const rawCards = Array.from(document.querySelectorAll('div')).filter((el) => {
      const text = el.innerText || ''
      return (
        (text.includes('Sponsored') || text.includes('प्रायोजित')) &&
        text.length > 80 &&
        text.length < 5000
      )
    })

    const cards = rawCards.filter((card) => {
      const childSponsoredCards = Array.from(card.querySelectorAll('div')).filter((child) => {
        const childText = child.innerText || ''
        return (
          child !== card &&
          (childText.includes('Sponsored') || childText.includes('प्रायोजित')) &&
          childText.length > 80
        )
      })
      return childSponsoredCards.length === 0
    })

    const ads = cards
      .map((card) => {
        const text = card.innerText?.trim()
        if (!text) return null

        if (
          text.includes('Meta Ad Library') ||
          text.includes('Filters') ||
          text.includes('Sort By') ||
          text.includes('Library ID') ||
          text.includes('Similar regional ads') ||
          text.includes('Meta ©')
        ) return null

        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
        const brand = lines[0] || 'Unknown Brand'

        const cta =
          lines.find((line) =>
            [
              'Shop Now',
              'Learn More',
              'Buy Now',
              'Get Offer',
              'Sign Up',
              'Contact Us',
              'Apply Now',
              'Book Now',
            ].includes(line)
          ) || 'Learn More'

        const copy = lines.join(' ')

        // Image extraction
        const imageCandidates = Array.from(card.querySelectorAll('img'))
          .map((img) => ({
            src: img.src,
            width: img.naturalWidth || img.width || 0,
            height: img.naturalHeight || img.height || 0,
          }))
          .filter(
            (img) =>
              img.src &&
              img.width > 120 &&
              img.height > 120 &&
              !img.src.includes('profile') &&
              !img.src.includes('emoji') &&
              !img.src.includes('static.xx.fbcdn.net')
          )
          .sort((a, b) => b.width * b.height - a.width * a.height)

        const backgroundImage =
          card
            .querySelector('[style*="background-image"]')
            ?.style?.backgroundImage?.match(/url\((['"]?)(.*?)\1\)/)?.[2] || null

        // Video extraction
        const videoEl = card.querySelector('video')
        const hasVideo = !!videoEl

        let video = null
        let videoPoster = null

        if (videoEl) {
          videoPoster = videoEl.getAttribute('poster') || null

          const directSrc = videoEl.getAttribute('src') || videoEl.currentSrc || null
          if (directSrc && !directSrc.startsWith('blob:') && directSrc.startsWith('http')) {
            video = directSrc
          }

          if (!video) {
            const sourceEl = Array.from(videoEl.querySelectorAll('source')).find((s) => {
              const src = s.getAttribute('src') || ''
              return src.startsWith('http') && !src.startsWith('blob:')
            })
            if (sourceEl) video = sourceEl.getAttribute('src')
          }

          if (!video) {
            const dataAttrs = ['data-src', 'data-video-src', 'data-url']
            for (const attr of dataAttrs) {
              const val = videoEl.getAttribute(attr)
              if (val && val.startsWith('http')) {
                video = val
                break
              }
            }
          }
        }

        // Scan card HTML for any fbcdn video URL
        if (!video) {
          const html = card.outerHTML || ''
          const mp4Match =
            html.match(/https:[^"'\s]+\.mp4[^"'\s]*/i) ||
            html.match(/(https:[^"'\s]+fbcdn[^"'\s]*(?:mp4|video)[^"'\s]*)/i)
          if (mp4Match) video = mp4Match[0]
        }

        const image =
          imageCandidates[0]?.src ||
          backgroundImage ||
          videoPoster ||
          null

        return { brand, copy, cta, image, video, hasVideo }
      })
      .filter(Boolean)

    const unique = ads.filter(
      (item, index, self) =>
        index === self.findIndex((x) => x.copy === item.copy)
    )

    return unique
      .filter((ad) => ad.copy && ad.copy.length > 100)
      .slice(0, 20)
  })

  // Merge network-intercepted video URLs into ad objects
  const enrichedData = data.map((ad) => {
    if (ad.video) return ad

    if (ad.image) {
      const posterKey = ad.image.split('?')[0].split('/').pop()
      for (const [key, videoUrl] of capturedVideoUrls.entries()) {
        if (posterKey && key.includes(posterKey.slice(0, 10))) {
          return { ...ad, video: videoUrl }
        }
      }
    }

    if (ad.hasVideo && capturedVideoUrls.size > 0) {
      const firstKey = capturedVideoUrls.keys().next().value
      const firstUrl = capturedVideoUrls.get(firstKey)
      capturedVideoUrls.delete(firstKey)
      return { ...ad, video: firstUrl }
    }

    return ad
  })

  await browser.close()

  // Convert all image URLs to base64 while URLs are still fresh
  const finalData = await Promise.all(
    enrichedData.map(async (ad) => ({
      ...ad,
      image: await toBase64(ad.image),
    }))
  )

  return finalData
}