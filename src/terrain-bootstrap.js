!(function () {
  try {
    var p = new URLSearchParams(location.search).get('terrain'),
      s = p || localStorage.terrain,
      t = 'Space' === s.slice(0, 5) ? 'space' : 'sea',
      l = document.createElement('link'),
      f = document.getElementById('favicon')
    f.href = './images/' + t + '/favicons/favicon-48x48.png'
    l.id = 'boot-trn'
    l.rel = 'stylesheet'
    l.href = './styles/' + t + '-boot.css'
    document.head.appendChild(l)
  } catch (e) {
    document.head.appendChild(
      Object.assign(document.createElement('link'), {
        id: 'boot-trn',
        rel: 'stylesheet',
        href: './styles/sea-boot.css'
      })
    )
  }
})()
