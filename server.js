/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

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

const data = {
  Sales: [500, 1000, 1500],
  Profit: [100.25, 200.5, 300.75]
}
const table = worker.table(data)
manager.host_table('remote_table', table)

// add connection to manager whenever a new client connects
app.ws('/subscribe', ws => manager.add_connection(ws))

app.use('/', perspective_assets([__dirname], true))

const server = app.listen(8080, () =>
  console.log(`Listening on port ${server.address().port}`)
)
