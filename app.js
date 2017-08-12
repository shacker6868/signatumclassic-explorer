/*
 * NOTE:
 * This app is buggy, and still in alpha.
 * 
 */
const path = require('path')
const express = require('express')
const exphbs = require('express-handlebars')
const walletRPC = require('bitcoin-core');
const querystring = require('querystring');

const app = express();


const redis = require('ioredis');
const client = redis.createClient({host : 'localhost', port : 6379});

// CONNECT AND AUTH WALLET
const walletSIGT = new walletRPC({
  host: '127.0.0.1',
  port: 9998,
  username: '',
  password: ''
})
wallet();

client.on('ready',function() {
 console.log("Redis is ready");
});

client.on('error',function() {
 console.log("Error in Redis");
});

app.engine('.hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs',
  layoutsDir: path.join(__dirname, 'views/layouts')
}))
app.set('view engine', '.hbs')
app.set('views', path.join(__dirname, 'views'))

/*

app.get('/', function(req, res) {
  res.render('index', {

  })
    app.use(express.static(path.join(__dirname + '/public')));
})
*/
var newBlockCount = 0;
var keyNum = 0;
var connections = 0;
var last10 = [];

function wallet() {
  console.log('wallet running')
  walletSIGT.getBlockCount(function(err,res) {
    console.log("RUNNING: @getBlockCount@wallet")
    newBlockCount = res;
    keyNum = res - 501;
    console.log("Block Count: " + res)
    checkDB();
  })

  walletSIGT.getConnectionCount(function(err,res) {
    console.log("RUNNING: @getConnectionCount@wallet")
    console.log("Connections: " + res)
    connections = res;
  })
}

function checkDB() {
  /* DEV ONLY */
  //newBlockCount = 500
  
  console.log("RUNNING: @checkDB")

  if (newBlockCount != 0 && newBlockCount != undefined) {
      console.log(newBlockCount)
      client.get(newBlockCount, function(err, reply) {
        if(reply == null) {
          getBlocks();
        } else {
          console.log("Already synced!")
          getKey();
        }
      });
  }
}

function getBlocks() {
  console.log("RUNNING: @getBlocks")
  var i = newBlockCount - 501;
  getNextBlock();
  function getNextBlock() {
    if (newBlockCount != 0 && i < newBlockCount) {
      walletSIGT.getBlockHash(i, function(err,res) {
        client.set(i, res);
        checkID()
      })
    } else if (i == newBlockCount) {
        getKey();
    }
  }
  function checkID() {
    i++;
    getNextBlock();
  }
}

function getKey() {
  if (newBlockCount != 0 && keyNum < newBlockCount) {
      client.get(keyNum).then(function (result) {
        getBlockInfo(keyNum, result);
      });
       keyNum++;
  }
}

function getBlockInfo(i, key) {
  console.log("RUNNING: @getBlockInfo " + key)
  walletSIGT.getBlock(key, function(err,res) {
    res = JSON.stringify(res)
    client.set('block'+i, res);
  });
  
  if (i == newBlockCount) {
    renderBlockInfo();
  } else if (i < newBlockCount) {
    getKey();
  }
}

function renderBlockInfo() {
  renderBlockInfo = function(){};
  var list10 = [];
  var n = newBlockCount - 500;
  outer();
  
  function inner() {
    client.get('block'+n).then(function (result) {
        list10.push(JSON.parse(result))
        outer();
    });
  }

  function outer() {
    if (n < newBlockCount) {
      console.log(n)
      n++;
      inner();
    }
  }

  var query = null;

  app.get('/', function(req, res) {
    res.render('index', {
      conn: connections,
      stuff: list10
    })
      app.use(express.static(path.join(__dirname + '/public')));
  })

  app.get('/block', function(req, res) {
    query = req.query;

    if (query.block != null) {
      query.block = parseInt(query.block);
      var hash, doBlock;

      walletSIGT.getBlockHash(query.block, function(err,res) {
        hash = res;
        doBlock = 1;

        if (doBlock == 1) {
          walletSIGT.getBlock(hash, function(err,res) {
            renderItem(res);
            doBlock = 0;
          })
        }
      });
    } else if (query.blockHash != null) {
      walletSIGT.getBlock(query.blockHash, function(err,res) {
        res.time = new Date(res.time*1000).toLocaleString();
        renderItem(res);
      });
    } else if (query.address != null) {
      walletSIGT.getReceivedByAddress(query.address, function(err,res) {
        renderItem(res);
      });
    }

    function renderItem(data) {
      res.render('block', {
        conn: connections,
        stuff: data
      })
      app.use(express.static(path.join(__dirname + '/public')));
    }
  })
}

app.listen(8082, '0.0.0.0');
