import axios from 'axios'
import {AxiosInstance} from 'axios'

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
    const res = await axios.post('/users/login', {
      email, password
    }, {baseURL: url})
    const {token, id} = res.data
    return new WekanClient(axios.create({
      baseURL: url,
      headers: {
        Authorization: `Bearer ${token}`
      }
    }), id, board)
  }

  lanes: Wekan.SwimLane[] = []
  lists: Wekan.List[] = []
  cards: Wekan.Card[] = []
  labels: Wekan.Label[] = []

  private constructor(
      private client: AxiosInstance,
      private userId: string,
      private boardId: string)
  {

  }

  async boards(): Promise<Wekan.Board[]> {
    return (await this.client.get(`/api/users/${this.userId}/boards`)).data
  }

  async getDockerBoard(): Promise<Wekan.Board> {
    var boards = await this.boards()
    boards = boards.filter(b => b._id = this.boardId)
    if (!boards[0])
      throw new Error(`no board "${this.boardId}"`)

    const board: Wekan.Board = (await this.client.get(`api/boards/${boards[0]._id}`)).data
    console.log(board)

    this.lanes = (await this.client.get(`/api/boards/${board._id}/swimlanes`)).data
    this.lists = (await this.client.get(`/api/boards/${board._id}/lists`)).data
    this.labels = board.labels

    for (var l of this.lists) {
      const cards = (await this.client.get(`/api/boards/${board._id}/lists/${l._id}/cards`)).data
      l.cards = []
      for (var c of cards) {
        const card = (await this.client.get(`/api/boards/${board._id}/lists/${l._id}/cards/${c._id}`)).data
        l.cards.push(card)
        // console.log(card)
      }
      // console.log(l.cards)
    }


    return boards[0]
  }

  async getCards(board: string) {
    await this.client.get(`/api`)
  }
}