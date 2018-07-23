import axios from 'axios'
import {AxiosInstance} from 'axios'
import { hostname } from 'os'

const SWIMLANE = process.env.SWIMLANE || hostname()

export namespace Wekan {
  export interface Board {
    _id: string
    title: string
    stars: number
    permission: 'public' | 'private'
    slug: string

    members: {
      userId: string
      isAdmin: boolean
      isActive: boolean
      isCommentOnly: boolean
    }[]

    labels: Label[]
  }

  export interface SwimLane {
    _id: string
    title: string
  }

  export interface List {
    _id: string
    title: string
    cards: Card[]
  }

  export interface Label {
    _id: string
    name: string
    color: string[]
  }

  export interface Card {
    _id: string
    title: string
    members: string[]
    labelIds: string[]
    listId: string
    boardId: string
    swimlaneId: string
    archived: boolean
    createdAt: Date
    sort: number
    isOvertime: boolean
    dateLastActivity: Date

    description?: string
    receivedAt?: Date
    startAt?: Date
    dueAt?: Date
    endAt?: Date
  }
}

export class WekanClient {

  static async init(board: string, url: string, email: string, password: string) {
    // console.log('trying to log in')
    console.log(email, password)
    const res = await axios.post('/users/login', {
      email, password
    }, {baseURL: url, headers: {'Content-Type': 'application/json'}})
    // console.log(res.status)
    if (res.status !== 200) throw new Error(`Login failed`)
    const {token, id} = res.data
    const c = new WekanClient(axios.create({
      baseURL: url,
      headers: {
        Authorization: `Bearer ${token}`
      }
    }), id, board)

    await c.getDockerBoard()

    return c
  }

  laneId!: string // lane corresponding to our host
  listId!: string // default insertion list
  // boardId!: string

  // Pour les cartes existantes
  cards: {[project: string]: Wekan.Card} = {}

  // lanes: Wekan.SwimLane[] = []
  // lists: Wekan.List[] = []
  // cards: Wekan.Card[] = []
  labels: Wekan.Label[] = []
  upId: string = ''
  downId: string = ''
  backupedId: string = ''

  private constructor(
      private client: AxiosInstance,
      private userId: string,
      private boardId: string)
  {

  }

  async boards(): Promise<Wekan.Board[]> {
    return (await this.client.get(`/api/users/${this.userId}/boards`)).data
  }

  async getDockerBoard() {
    // var boards = await this.boards()
    const board: Wekan.Board = (await this.client.get(`api/boards/${this.boardId}`)).data

    const lists = (await this.client.get(`/api/boards/${this.boardId}/lists`)).data
    this.listId = lists[0]._id
    await this.getLane()

    this.labels = board.labels
    this.labels.forEach(l => {
      if (l.name.toLocaleLowerCase() === 'up')
        this.upId = l._id
      if (l.name.toLocaleLowerCase() === 'down')
        this.downId = l._id
        if (l.name.toLocaleLowerCase().startsWith('backup'))
        this.backupedId = l._id
    })

    for (var l of lists) {
      const cards = (await this.client.get(`/api/boards/${this.boardId}/lists/${l._id}/cards`)).data
      l.cards = []
      for (var c of cards) {
        const card = (await this.client.get(`/api/boards/${this.boardId}/lists/${l._id}/cards/${c._id}`)).data

        // Ignore cards that are not about this host
        if (card.swimlaneId !== this.laneId) continue

        const re_proj = /^#### infos auto \(([^\)]*)\)/m
        const match = re_proj.exec(card.description)

        if (match) {
          this.cards[match[1]] = card
        }
        // l.cards.push(card)
      }
    }

  }

  /**
   * Create a Swimlane that corresponds to our host name or get the one
   */
  async getLane() {
    const lanes: Wekan.SwimLane[] = (await this.client.get(`/api/boards/${this.boardId}/swimlanes`)).data
    const lane = lanes.filter(l => l.title.toLocaleLowerCase() === SWIMLANE.toLocaleLowerCase())[0]

    if (lane) {
      this.laneId = lane._id
    } else {
      const res = await this.client.post(`/api/boards/${this.boardId}/swimlanes`, {
        title: SWIMLANE
      })
      this.laneId = res.data._id
    }
  }

  async updateCard(
    title: string,
    infos: string,
    running: boolean,
    not_running: boolean,
    has_backup: boolean
  ) {

    const def = `#### Informations Projet

 * **Chef de Projet** :
 * **Sponsor** :
 * **Devis** :

<hr>`
    const card = this.cards[title]
    if (card) {
      const desc = (card.description!||'').replace(/^<hr>[^]*/m, '') + '<hr>\n' + infos

      const labels = (card.labelIds || []).filter(l => l !== this.downId && l !== this.upId && l !== this.backupedId)
      if (running)
        labels.push(this.upId)
      if (not_running)
        labels.push(this.downId)
      if (has_backup)
        labels.push(this.backupedId)

      console.log(`updating ${title}`)
      await this.client.put(`/api/boards/${this.boardId}/lists/${this.listId}/cards/${card._id}`, {
        description: desc,
        labelIds: labels
      })
    } else {
      await this.client.post(`/api/boards/${this.boardId}/lists/${this.listId}/cards`, {
        title,
        swimlaneId: this.laneId,
        description: `${def}\n${infos}`,
        authorId: this.userId
      })
    }
  }
}