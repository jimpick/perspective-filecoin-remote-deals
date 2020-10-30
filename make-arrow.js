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

const worker = perspective

// perspective.initialize_profile_thread()

console.log('Loading')
const dataFile = './deals-189896.json'
const contents = fs.readFileSync(dataFile, 'utf8')
const slingshotFile = './client-id-to-teams.json'
const slingshotContent = fs.readFileSync(slingshotFile, 'utf8')
console.log('Parsing')
const rawDeals = JSON.parse(contents)
const slingshot = JSON.parse(slingshotContent)
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
  if (slingshot[deal.Client]) {
    const { name, rank, url } = slingshot[deal.Client]
    // console.log('Client:', deal.Client, name)
    newDeal.SlingshotName = name
    newDeal.SlingshotRank = rank
    newDeal.SlingshotURL = url
  } else {
    newDeal.SlingshotName = ''
    newDeal.SlingshotRank = ''
    newDeal.SlingshotURL = ''
  }
  return newDeal
})

console.log('Loading')
const table = worker.table(dealArray)

const view = table.view({
  filter: [
    ['SectorStartEpoch', '!=', -1],
    ['SlingshotName', '!=', '']
  ]
})

view.to_arrow().then(data => {
  console.log('Writing')
  fs.writeFileSync('slingshot.arrow', Buffer.from(data))
  process.exit(0)
})
