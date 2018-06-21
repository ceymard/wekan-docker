import * as Dockerode from 'dockerode'
import { WekanClient } from './wekan'

const BOARD = process.env.BOARD! // `HR6thXSb6nnwSTppB`
const EMAIL = process.env.EMAIL!
const PASSWORD = process.env.PASSWORD!
const SWIMLANE = process.env.SWIMLANE!
const WEKAN = process.env.WEKAN_URL || 'http://wekan'

if (!BOARD || !EMAIL || !PASSWORD || !SWIMLANE)
  throw new Error(`Need $BOARD, $EMAIL, $PASSWORD and $SWIMLANE`)

async function run() {

  const client = await WekanClient.init(
    BOARD,
    WEKAN,
    EMAIL,
    PASSWORD
  )

  const dock = new Dockerode({socketPath: '/var/run/docker.sock'})

  const projects = [] as {
    name: string
    containers: Dockerode.ContainerInspectInfo[]
  }[]

  var cts = await dock.listContainers({all: true})
  const pr = (a: Dockerode.ContainerInfo) => a.Labels && a.Labels['com.docker.compose.project'] || a.Names[0] || ''
  cts = cts.filter(c => pr(c)[0] !== '/').sort((a, b) => pr(a) < pr(b) ? -1 : pr(a) > pr(b) ? 1 : 0)

  for (var _ of cts) {
    const c = await dock.getContainer(_.Id)
    const info = await c.inspect()

    const project = pr(_)

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
        if (e.startsWith('VIRTUAL_HOST=')) {
          e = e.replace('VIRTUAL_HOST=', '')
          return e
        }
      }
      return ''
    }).filter(a => a).map(a => `[${a.replace('.sales-way.com', '')}](https://${a})`).join(', ')
    const running = p.containers.map(c => c.State.Running).filter(a => a).length > 0
    // console.log(title, urls, running)
    const containers = p.containers.map(c =>
      ` * **${c.Name.slice(1)}** \`${(c.NetworkSettings.IPAddress + ' ' + Object.keys(c.NetworkSettings.Ports||{}).join(', ')).trim() || '<éteint>'}\`\n*${c.Config.Image}*\n${(new Date(c.Created)).toLocaleString('fr-FR')}\n\n`
    ).join('\n')

    const description = `#### infos auto (${title})
${urls ? `
**URL**: ${urls}
` : ''}

${(containers)}
`
    await client.updateCard(title, description, running)
  }
}

run().catch(e => console.error(e.stack))