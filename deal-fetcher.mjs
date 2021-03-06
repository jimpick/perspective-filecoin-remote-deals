import fs from 'fs'
import { exec } from 'child_process'
import { LotusRPC } from '@filecoin-shipyard/lotus-client-rpc'
import { NodejsProvider } from '@filecoin-shipyard/lotus-client-provider-nodejs'
import { mainnet } from '@filecoin-shipyard/lotus-client-schema'
// import { formatDistance } from 'date-fns'
import dateFns from 'date-fns'

// const url = 'ws://127.0.0.1:7777/rpc/v0'
// const url = 'http://127.0.0.1:7777/rpc/v0'
const url = 'https://lotus.jimpick.com/mainnet_api/0/node/rpc/v0'
// const provider = new BrowserProvider(url)
// const provider = new NodejsProvider(url, { transport: 'http' })
const provider = new NodejsProvider(url)
const client = new LotusRPC(provider, { schema: mainnet.fullNode })

async function run () {
  try {
    const version = await client.version()
    console.log('Version', version)
    const chainHead = await client.chainHead()
    const headTipSet = chainHead.Cids
    const currentHeight = chainHead.Height
    const selectedHeight = currentHeight // Slider
    const tipSet = (await client.chainGetTipSetByHeight(selectedHeight, headTipSet)).Cids
    console.log('Fetching deals at height:', selectedHeight)
    console.log('Tipset:', tipSet)
    const startTime = new Date()

    const cmd = `curl -X POST ` +
      `-H "Content-Type: application/json" ` +
      `--data '{ "jsonrpc": "2.0", "method": "Filecoin.StateMarketDeals", "params": [${JSON.stringify(tipSet)}], "id": 1 }' ` +
      url + ` > deals-${selectedHeight}-raw.json`
    console.log('Cmd:', cmd)

    /*
    const deals = await client.StateMarketDeals(tipSet)
    fs.writeFileSync(`deals-${selectedHeight}.json`, JSON.stringify(deals, null, 2))
    */
    console.log('Done', dateFns.formatDistance(startTime, new Date()))
  } catch (e) {
    console.error('error', e)
  }
  await client.destroy()
}
run()
