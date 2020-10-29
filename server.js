/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

const fs = require('fs')
const perspective = require('@finos/perspective')
const express = require('express')
const expressWs = require('express-ws')
const { WebSocketManager, perspective_assets } = perspective

const worker = perspective

const app = express()
expressWs(app)

perspective.initialize_profile_thread()

// create Perspective WebSocketManager and host table
const manager = new WebSocketManager()

//securities().then(table => manager.host_table("remote_table", table));

// const dataFile = '/Users/jim/filecoin/deal-fetcher/deals-181142-truncated.json'
const dataFile = './deals-189896.json'
console.log('Loading')
const contents = fs.readFileSync(dataFile, 'utf8')
console.log('Parsing')
const rawDeals = JSON.parse(contents)
console.log('Flattening')
const dealArray = [...Object.entries(rawDeals)].map(([dealNumber, { Proposal, State }]) => ({ dealNumber, ...Proposal, ...State })).map(deal => {
  let shortLabel = deal && deal.Label
  if (shortLabel.length > 30) {
    shortLabel = shortLabel.slice(0,23) + '...' + shortLabel.slice(-4)
  }
  const newDeal = {...deal, LabelShort: shortLabel, PieceCID: deal.PieceCID['/']}
  if (newDeal.StartEpoch >= 0) {
    newDeal.StartBin10000 = Math.floor(newDeal.StartEpoch / 10000) * 10000
    newDeal.StartBin1000 = Math.floor(newDeal.StartEpoch / 1000) * 1000
  }
  if (newDeal.SectorStartEpoch >= 0) {
    newDeal.SectorStartBin10000 = Math.floor(newDeal.SectorStartEpoch / 10000) * 10000
    newDeal.SectorStartBin1000 = Math.floor(newDeal.SectorStartEpoch / 1000) * 1000
  }
  return newDeal
})

console.log('Loading')
const table = worker.table(dealArray)
console.log('Hosting')
manager.host_table('remote_table', table)

// add connection to manager whenever a new client connects
app.ws('/subscribe', ws => manager.add_connection(ws))

app.use('/', perspective_assets([__dirname], true))

const server = app.listen(8080, () =>
  console.log(`Listening on port ${server.address().port}`)
)
