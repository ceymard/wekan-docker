import axios from 'axios'

axios.defaults.baseURL = "http://localhost:4445"
const BOARD = `Status des Applications`

async function run() {
  const res = await axios.post('/users/login', {
    email: 'dsi@sales-way.com',
    password: 'Salesway1'
  })

  // console.log(res.data)
  // Le token d'accès à wekan pour
  const token = res.data.token
  const user = res.data.id
  axios.defaults.headers = {
    Authorization: `Bearer ${res.data.token}`,
    // 'Content-Type': 'application/json'
  }
  // console.log(axios.defaults.headers)


  const boards = await axios.get(`/api/users/${user}/boards`)

  console.log(boards.data)
}

run().catch(e => console.error(e))