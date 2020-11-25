import fs from 'fs'

const lines = fs.readFileSync('pricing.csv', 'utf8').split('\n')

let lastHeight = 'height'
for (const line of lines) {
  const cells = line.split(',')
  if (cells.length > 0) {
    const height = cells[0]
    if (height === 'height') {
      console.log([cells[0], cells[1], 'logPrice', ...cells.slice(2)].join(','))
    } else if (height !== lastHeight) {
      // skip first entry for each height
      lastHeight = height
    } else {
      const price = Number(cells[1])
      const logPrice = -Math.log(1/(price + 1))
      console.log([cells[0], price, logPrice, ...cells.slice(2)].join(','))
    }
  }
}
