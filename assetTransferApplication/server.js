const express = require('express')
const app = express()
const port = 3000
// const FabNetwork = require('./index.js')
const FabNetwork = require('./index_grpc')

app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))
app.use(express.json())

app.post('/submitTX', async (req, res) => {
    const data = req.body
    const identity = data.identity
    const organization = data.organization
    const msp = data.msp
    const channel = data.channel
    const txName = data.txName
    const txParams = data.txParams

    // console.log("Identity creation...")
    // await FabNetwork.createIdentity(identity, organization, msp)
    // console.log("Identity created")
    // console.log("Connection creation")
    // await FabNetwork.createConnection(identity, organization)
    // console.log("Connection created")
    console.log("Transaction submitting")
    const resultTx = await FabNetwork.submitT(channel, txName, txParams)
    console.log("Transaction submitted")

    res.send(resultTx)
})

app.listen(port, () => {
    console.log(`Server listening at ${port}`)
})