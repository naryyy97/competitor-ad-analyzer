const { chromium } = require('playwright')
const fs = require('fs')

async function scrapeAds() {
  const browser = await chromium.launch({
    headless: false,
  })

  const page = await browser.newPage({
    viewport: { width: 1440, height: 2000 },
  })

  await page.goto(
    'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=CA&is_targeted_country=false&media_type=all&search_type=page&sort_data[direction]=desc&sort_data[mode]=total_impressions&view_all_page_id=113977565314990',
    {
      waitUntil: 'networkidle',
      timeout: 120000,
    }
  )


  await page.waitForTimeout(15000)

  await page.screenshot({
    path: 'ads-page.png',
    fullPage: true,
  })

  const data = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'))
      .map((img) => img.src)
      .filter((src) => src && src.startsWith('http'))

    const videos = Array.from(document.querySelectorAll('video'))
      .map((video) => video.src)
      .filter((src) => src && src.startsWith('http'))

    const possibleAds = Array.from(document.querySelectorAll('div'))
  .map((el) => ({
    text: el.innerText,
  }))
  .filter(
    (item) =>
      item.text &&
      item.text.length > 80 &&
      (
        item.text.includes('Shop Now') ||
        item.text.includes('Learn More') ||
        item.text.includes('Buy Now') ||
        item.text.includes('Sponsored')
      )
  )
  .slice(0, 20)

    return {
      images,
      videos,
      possibleAds,
    }
  })

  fs.writeFileSync('ads-data.json', JSON.stringify(data, null, 2))

  console.log('Saved ads-data.json')
  console.log('Saved ads-page.png')

  await browser.close()
}

scrapeAds()