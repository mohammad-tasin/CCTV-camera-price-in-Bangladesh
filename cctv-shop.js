addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
  })
  
  async function handleRequest(request) {
    const url = new URL(request.url)
    const path = url.pathname
  
    if (path.endsWith('/sitemap.xml')) {
      return handleSitemapRequest()
    }
  
    const targetUrl = `https://www.startech.com.bd${path}`
    const response = await fetch(targetUrl)
  
    if (!response.ok) {
      return new Response("Failed to fetch content", { status: response.status })
    }
  
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      return new Response(response.body, {
        status: response.status,
        headers: response.headers
      })
    }
  
    let body = await response.text()
  
    if (path === '/') {
      const posts = await fetchPosts()
      body = modifyContent(body, url.origin, posts)
    } else {
      body = modifyContent(body, url.origin)
    }
  
    return new Response(body, {
      status: response.status,
      headers: { 'Content-Type': 'text/html' }
    })
  }
  
  async function fetchPosts() {
    const postsUrl = 'https://bd.cctvshop.workers.dev/Security-Camera/cc-camera'
    const postsResponse = await fetch(postsUrl)
  
    if (!postsResponse.ok) {
      return []
    }
  
    const postsHtml = await postsResponse.text()
    return extractPosts(postsHtml, 5)
  }
  
  function extractPosts(html, count) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const posts = []
    
    const postElements = doc.querySelectorAll('.product-thumb') // Update with actual post selector
  
    for (let i = 0; i < Math.min(postElements.length, count); i++) {
      posts.push(postElements[i].outerHTML)
    }
  
    return posts
  }
  
  function modifyContent(content, origin, posts = []) {
    content = content.replace(/(href|src)=["']\/([^"']+)["']/gi, `$1="${origin}/$2"`)
    content = content.replace(/(href|src)=["']https:\/\/www.startech.com.bd\/([^"']+)["']/gi, `$1="${origin}/$2"`)
  
    content = content.replace(
      /<head>/i,
      '<head><meta name="google-site-verification" content="car4et3auS8pHMOsP-5lwXT-RU0tjS0AOKL06axWjsk" />'
    )
  
    content = content.replace(
      /<head>/i,
      `<head><style>body { background-color: #e0f7fa; }</style>`
    )
  
    content = content.replace(
      /<div class="sliding_text_wrap">[\s\S]*?<\/div>/i,
      ''
    )
  
    if (posts.length > 0) {
      const postsHtml = posts.join('')
      content = content.replace(
        /<\/body>/i,
        `${postsHtml}</body>`
      )
    }
  
    return content
  }
  