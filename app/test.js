const edge = require('node-edge') 

let port = 8125

function voltageSource(){
  return 50 + Math.floor(Math.random() * 10)
}

/********************

    server section

 ********************/
const server = edge.createServer(port) //, (server) => {
//const server = edge.createServer() //, (server) => {
  console.log('edge server', port)

  server.publish('edge-pub-1', (tcp) => {
     tcp.send( voltageSource() )
  })

  server.pub('edge-pub-2', (tcp) => {
     tcp.polling = 9000
     tcp.send( {value:voltageSource()} )
  })

  server.pub('edge-pub-3', (tcp) => {
     tcp.send( JSON.stringify({topic:'edge-pub-3', value:voltageSource()}) )
  })

   server.sub('client-pub', (data) => {
     console.log('client-pub', data)
  })

  /***
   * server data source
   */
  server.on('source-data-1', (tcp) => {
     if(tcp.payload === 'on'){
       //tcp.send( tcp.payload )
       tcp.end( tcp.payload )		
     }
     else if(tcp.payload === 'off'){
       //tcp.send( tcp.payload )
       tcp.end( tcp.payload )		
     }
  })
 
  server.on('source-data-2', (tcp) => {
      tcp.end( voltageSource() )
  })

  server.on('source-data-3', (tcp) => {
      tcp.send( {topic:'source-data-3' , value:voltageSource()} )
  })

  server.on('error', (e) => {
      console.log('server error:', e.message)
  })
  
  server.on('connection', (count) => { // //server.getConnections((err, count) => {
     console.log('**count:', count)
     if(count > 10){
        console.log('runaway client count!')
        process.exit()
     }
  })

  //server.listen(port)
  setImmediate(() => {
    console.log('server.listening', server.listening)			
    console.log('server.address()', server.address())
  })

//})

/*********************

    client section

 *********************/
let ec1 = new edge.client(port)

console.log('edge client', port)

ec1.on('ready', (data) => {
    console.log('ec1 ready', data)
})

ec1.getResources((data) => {
    console.log('server resources', data)
})

ec1.on('error', (e) => {
    console.log('ec1 error', e.message)
})

setTimeout(() => {
    ec1.read('edge-pub', (data) => {
        console.log('ec1 read latest edge-pub-1', data.toString())
    })
}, 100)

/***
  * subscribe
  */
ec1.subscribe('edge-pub-1', (data) => {
    let v = parseInt(data)
    console.log('edge-pub-1', v)

    if(v < 53){
      ec1.send('source-data-1', 'on', (data) => { console.log('***send source-data-1 on', data) })
    }
    else{
      ec1.send('source-data-1', 'off', (data) => { console.log('***send source-data-1 off', data) })
    }
})

ec1.sub('edge-pub-2', (data) => {
    console.log('edge-pub-2', data)
})

ec1.sub('edge-pub-3', (data) => {
    console.log('edge-pub-3', JSON.parse(data))
})

ec1.pub('client-pub', (tcp) => {
    let pl = voltageSource() //'ed is pogi'
    console.log('pl', pl)
    //tcp.polling = 300
    console.log('tcp.dataChange', tcp.dataChange)
    tcp.send(pl)
})


/***
  * client
  */
ec1.read('source-data-2', (data) => {
    console.log('ec1 source-data-2', data.toString())
})

ec1.read('source-data-3', (data) => {
    console.log('ec1 source-data-3', data)
    console.log('ec1 source-data-3 data.topic', data.topic)
})

setTimeout(() => {

    /***
      * unsubscribe
      */

    ec1.unsubscribe('edge-pub-1', (data) => {
      console.log('unsub edge-pub-1', data.toString())
    })

    ec1.unsub('edge-pub-2', (data) => {
        console.log('unsub edge-pub-2', data.toString())
    })

    ec1.unsub('edge-pub-3')/*, (data) => {
        console.log('unsub edge-pub-3', data.toString())
    })*/

}, 20000)

setTimeout(() => {

    /***
      * subscribe again
      */

    ec1.subscribe('edge-pub-1', (data) => {
      console.log('sub again edge-pub-1', data.toString())
    })

    ec1.sub('edge-pub-2')/*, (data) => {
        console.log('sub again edge-pub-2', data.toString())
    })*/

    ec1.sub('edge-pub-3')/*, (data) => {
        console.log('sub again edge-pub-3', data.toString())
    })*/

}, 30000)  


