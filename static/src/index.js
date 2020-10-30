/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

import perspective from '@finos/perspective'

import '@finos/perspective-viewer'
import '@finos/perspective-viewer-datagrid'
import '@finos/perspective-viewer-d3fc'

import '@finos/perspective-viewer/dist/umd/material.css'

import './index.css'

import pako from 'pako'
import delay from 'delay'

const worker = perspective.shared_worker()

const config = {
  plugin: 'datagrid',
  'computed-columns': [
    'concat_comma("Client","Provider")',
    'invert(invert("PieceSize")) as "TotalSize"'
  ],
  'row-pivots': ['SectorStartBin1000', 'concat_comma(Client, Provider)'],
  aggregates: {
    dealNumber: 'count',
    StartEpoch: 'low',
    LabelShort: 'distinct count',
    SectorStartEpoch: 'low',
    PieceSize: 'avg',
    StoragePricePerEpoch: 'avg',
    SlingshotName: 'dominant',
    SlingshotRank: 'dominant'
  },
  filters: [
    ['SectorStartEpoch', '!=', -1],
    ['SlingshotName', '!=', '']
  ],
  sort: [
    ['SectorStartBin1000', 'desc'],
    ['TotalSize', 'desc']
  ],
  columns: [
    'dealNumber',
    'SectorStartEpoch',
    'StartEpoch',
    'LabelShort',
    'PieceSize',
    'TotalSize',
    'StoragePricePerEpoch',
    'SlingshotName',
    'SlingshotRank'
  ],
  selectable: null,
  editable: null,
  'column-pivots': null
}

const status = document.createElement('div')
status.textContent = 'Fetching data... (34MB compressed)'
document.body.appendChild(status)

window.addEventListener('load', async () => {
  const viewer = document.createElement('perspective-viewer')
  document.body.append(viewer)

  async function download (defaultLength) {
    // https://dev.to/samthor/progress-indicator-with-fetch-1loo
    const response = await fetch('./slingshot.arrow.gz')
    let length = response.headers.get('Content-Length')
    if (!length) {
      length = defaultLength
      // something was wrong with response, just give up
      // return await response.arrayBuffer()
    }
    const array = new Uint8Array(length)
    let at = 0 // to index into the array
    const reader = response.body.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      status.textContent = `Fetching data... ${at} of ${length} bytes`
      array.set(value, at)
      at += value.length
    }
    return array
  }

  const compressed = await download(33947900)
  status.textContent = `Uncompressing data... (compressed size: ${compressed.byteLength} bytes)`
  await delay(100)
  const buffer = pako.ungzip(compressed)
  const size = +buffer.buffer.byteLength
  const table = worker.table(buffer.buffer)
  let count = 1
  let attached = false
  async function watch () {
    const state = {
      rows: 0
    }
    while (true) {
      if (state.rows === 0) {
        status.textContent = `Loading data... (${size} bytes, ${count++} seconds)`
      } else {
        status.textContent =
          `Loaded ${buffer.length} bytes, ${state.rows} rows. ` +
          `Rendering table... (${count++} seconds)`
      }
      if (!attached && viewer.view) {
        attached = true
        async function getRows () {
          state.rows = await viewer.view.num_rows()
        }
        getRows()
      }
      if (viewer.__render_times && viewer.__render_times.length > 0) {
        status.textContent = `Ready. ${size} bytes, ${state.rows} rows in ${count} seconds`
        break
      }
      await delay(1000)
    }
  }
  watch()

  viewer.load(table)
  viewer.restore(config)

  window.viewer = viewer
})
