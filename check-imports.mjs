import http from 'http'

const url = 'http://localhost:5173/Spothitch/src/main.js'
http.get(url, (res) => {
  let data = ''
  res.on('data', (chunk) => { data += chunk })
  res.on('end', () => {
    const imports = data.match(/from "([^"]+)"/g) || []
    console.log('Total imports:', imports.length)

    let checked = 0
    const errors = []

    if (imports.length === 0) {
      console.log('No imports found')
      return
    }

    imports.forEach((imp) => {
      const path = imp.replace('from "', '').replace('"', '')
      const fullUrl = 'http://localhost:5173' + path
      http.get(fullUrl, (r) => {
        checked++
        if (r.statusCode !== 200) {
          errors.push(path + ' -> ' + r.statusCode)
        }
        if (checked === imports.length) {
          if (errors.length) {
            console.log('MISSING:', JSON.stringify(errors, null, 2))
          } else {
            console.log('All', imports.length, 'imports resolve OK')
          }
        }
      }).on('error', (e) => {
        checked++
        errors.push(path + ' -> ' + e.message)
        if (checked === imports.length) {
          console.log('ERRORS:', JSON.stringify(errors, null, 2))
        }
      })
    })
  })
})
