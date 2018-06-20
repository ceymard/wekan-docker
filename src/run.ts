import * as Dockerode from 'dockerode'
import { WekanClient } from './wekan'
import { inspect } from 'util'

const BOARD = `HR6thXSb6nnwSTppB`


async function run() {

  // const client = await WekanClient.init(
  //   BOARD,
  //   'http://localhost:4445',
  //   'dsi@sales-way.com',
  //   'Salesway1'
  // )

  const dock = new Dockerode({socketPath: '/var/run/docker.sock'})

  const cts = await dock.listContainers({all: true})
  for (var _ of cts) {

    const c = await dock.getContainer(_.Id)
    const info = await c.inspect()
    // info.Config.Env
    console.log(inspect(info, {colors: true, depth: null}))
  }
  // console.log(cts)

  // Get current user boards
  // const board = (await client.getDockerBoard())
}

run().catch(e => console.error(e.stack))