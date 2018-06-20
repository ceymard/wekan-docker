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

  const projects = [] as {
    name: string
    containers: Dockerode.ContainerInspectInfo[]
  }[]

  const cts = await dock.listContainers({all: true})
  const pr = (a: Dockerode.ContainerInfo) => a.Labels['com.docker.compose.project']
  cts.sort((a, b) => pr(a) < pr(b) ? -1 : pr(a) > pr(b) ? 1 : 0)
  for (var _ of cts) {
    const c = await dock.getContainer(_.Id)
    const info = await c.inspect()
    const project = _.Labels['com.docker.compose.project']

    const last = projects[projects.length - 1]
    if (last && last.name === project) {
      last.containers.push(info)
    } else {
      projects.push({
        name: project,
        containers: [info]
      })
    }
  }

  for (var p of projects) {
    const title = p.name
    const urls = p.containers.map(c => {
      for (var e of c.Config.Env) {
        // console.log(e)
        if (e.startsWith('VIRTUAL_HOST=')) {
          e = e.replace('VIRTUAL_HOST=', '')
          return e
        }
      }
      return ''
    }).filter(a => a).join(', ')
    const running = p.containers.map(c => c.State.Running).filter(a => a).length > 0
    console.log(title, urls, running)
  }
}

run().catch(e => console.error(e.stack))