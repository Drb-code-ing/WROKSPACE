const frends = []

async function loadData() {
  const endpoint = 'http://localhost:3001/friends'
  const res = await fetch(endpoint)
  const data = await res.json()
  frends.push(...data)
  console.log(frends)
}

function renderData() {
  console.log('init end')
  const oBody = document.querySelector('table tbody')
  if(frends.length > 0) {
    oBody.innerHTML = frends.map(it => {
      return `<tr>
        <td>${it.id}</td>
        <td>${it.name}</td>
        <td>${it.age}</td>
      </tr>`
    }).join('')
  }
}

async function init() {
  console.log('init start')
  await loadData()
  renderData()
}
init()
