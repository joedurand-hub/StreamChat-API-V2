import Publication from '../../models/Publication.js'
import User from '../../models/User.js'

const escapeHtml = (value = '') => value.toString()
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

export const renderSharedPost = async (req, res, next) => {
    try {
        const post = await Publication.findById(req.params.id).lean()
        if (!post) return res.status(404).send('Publicación no encontrada')

        const isRestricted = Boolean(post.checkExclusive || post.checkNSFW)
        const author = escapeHtml(post.userName || 'Alguien')
        const description = escapeHtml(isRestricted
            ? 'Abre StreamChat para ver esta publicación.'
            : (post.content || post.title || `${post.userName || 'Alguien'} publicó en StreamChat`).slice(0, 180))
        const image = !isRestricted ? post.images?.[0]?.secure_url : null
        const canonicalUrl = `${req.protocol}://${req.get('host')}/share/post/${post._id}`
        const deepLink = `streamchat://post/${post._id}`
        const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.buildingsofttech.streamchat'

        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        return res.status(200).send(`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${author} en StreamChat</title>
<meta name="description" content="${description}"><meta property="og:type" content="article">
<meta property="og:title" content="${author} en StreamChat"><meta property="og:description" content="${description}">
<meta property="og:url" content="${canonicalUrl}">${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ''}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
<style>body{font-family:system-ui,sans-serif;background:#f7fbff;color:#17202a;margin:0;display:grid;min-height:100vh;place-items:center}.card{box-sizing:border-box;width:min(92vw,520px);background:#fff;border:1px solid #dbeaf5;border-radius:24px;padding:28px;text-align:center;box-shadow:0 14px 40px #0b5d8a1a}img{width:100%;max-height:360px;object-fit:cover;border-radius:16px}.brand{color:#149ee4;font-weight:800}.actions{display:grid;gap:12px;margin-top:24px}a{display:block;padding:14px 18px;border-radius:999px;text-decoration:none;font-weight:700}.primary{background:#149ee4;color:#fff}.secondary{border:1px solid #149ee4;color:#0878b3}</style>
</head><body><main class="card"><div class="brand">StreamChat</div><h1>${author} compartió una publicación</h1>${image ? `<img src="${escapeHtml(image)}" alt="Publicación de ${author}">` : ''}<p>${description}</p><div class="actions"><a class="primary" href="${deepLink}">Abrir en StreamChat</a><a class="secondary" href="${playStoreUrl}">Descargar para Android</a></div></main></body></html>`)
    } catch (error) {
        next(error)
    }
}

export const renderSharedProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .select('userName description profilePicture followers publications verified profileVerified')
            .lean()
        if (!user) return res.status(404).send('Perfil no encontrado')

        const userName = escapeHtml(user.userName || 'Usuario')
        const description = escapeHtml(
            (user.description || `Conoce a ${user.userName || 'este usuario'} en StreamChat`).slice(0, 180),
        )
        const image = user.profilePicture?.secure_url
        const canonicalUrl = `${req.protocol}://${req.get('host')}/share/profile/${user._id}`
        const deepLink = `streamchat://profile/${user._id}`
        const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.buildingsofttech.streamchat'
        const followerCount = Array.isArray(user.followers) ? user.followers.length : 0
        const publicationCount = Array.isArray(user.publications) ? user.publications.length : 0

        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        return res.status(200).send(`<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${userName} en StreamChat</title>
<meta name="description" content="${description}"><meta property="og:type" content="profile">
<meta property="og:title" content="${userName} en StreamChat"><meta property="og:description" content="${description}">
<meta property="og:url" content="${canonicalUrl}">${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ''}
<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">
<style>*{box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:#f7f8fc;color:#15171a;margin:0;min-height:100vh;display:grid;place-items:center;padding:24px}.page{width:min(92vw,520px);display:grid;gap:18px}.profile-card{display:grid;gap:24px;min-height:560px;padding:28px;border-radius:28px;background:#38b6ff;color:#fff;text-decoration:none;box-shadow:0 18px 50px #004aad2b}.brand{font-size:28px;font-weight:800;letter-spacing:-1px}.inner{display:grid;place-items:center;align-content:space-between;gap:24px;padding:32px 20px;border-radius:28px;background:#fff;color:#15171a}.avatar{width:180px;height:180px;object-fit:cover;border-radius:999px;border:5px solid #38b6ff}.avatar-fallback{width:180px;height:180px;display:grid;place-items:center;border-radius:999px;border:5px solid #38b6ff;background:#f1f3ff;color:#004aad;font-size:64px;font-weight:800}.name{margin:0;text-align:center;font-size:32px}.description{text-align:center;color:#5f6368}.stats{display:flex;justify-content:center;gap:24px;color:#5f6368}.store-hint{justify-self:center;padding:12px 18px;border-radius:999px;background:#004aad;font-weight:700}.actions{display:grid;gap:12px}.open-app{display:block;padding:15px 18px;border-radius:999px;text-align:center;text-decoration:none;font-weight:700;background:#004aad;color:#fff}.caption{text-align:center;color:#5f6368;font-size:14px}</style>
</head><body><main class="page"><a class="profile-card" href="${playStoreUrl}" aria-label="Descargar StreamChat"><div class="brand">stream chat</div><section class="inner">${image ? `<img class="avatar" src="${escapeHtml(image)}" alt="Foto de ${userName}">` : `<div class="avatar-fallback" aria-hidden="true">${userName.charAt(0).toUpperCase()}</div>`}<div><h1 class="name">${userName}</h1><p class="description">${description}</p><div class="stats"><span>${followerCount} seguidores</span><span>${publicationCount} publicaciones</span></div></div></section><span class="store-hint">Descargar StreamChat</span></a><div class="actions"><a class="open-app" href="${deepLink}">Abrir perfil en StreamChat</a><div class="caption">Toca la tarjeta para ir a Google Play</div></div></main></body></html>`)
    } catch (error) {
        next(error)
    }
}
