/*
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var express = require('express');
var exphbs = require('express-handlebars')
var path = require('path');
var walletRPC = require('bitcoin-core');

var app = express();
var arrData = [],
    txData = [];
var startBlock = 0,
    currentBlock = 0,
    data,
    totalTx = 0;


app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'views/layouts')
}))
app.set('view engine', '.hbs')
app.set('views', path.join(__dirname, 'views'))

app.get('/', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.render('index', {
        data: arrData,
        txData: txData
    })
})

module.exports = app;

// CONNECT AND AUTH WALLET
const walletSIGT = new walletRPC({
    host: '127.0.0.1',
    port: 9998,
    username: '',
    password: ''
})

function sync(x) {
    if(x==1) {
        console.log("Checking height...")
        walletSIGT.getBlockCount(function(err,res) {
            currentBlock = Math.ceil(res/100)*100 - 100;
            console.log("RUNNING: @getBlockCount@socketInterval");
            console.log("Block Count: " + res);
            console.log("Sync Max: " + currentBlock);
        })
    } else {
        if (startBlock <= currentBlock) {
            //console.log("start block: " + startBlock) # debug
            walletSIGT.command([{ method: 'getBlockByNumber', parameters: [startBlock]}]).then((res) =>
            data = res);

            if (data != null) {
                for (i=0; data[0].tx[i] != null; i++) {
                    totalTx++;
                }

                arrData.push("{ x : "+JSON.parse(data[0].time*1000) + ", y : " + JSON.parse(data[0].difficulty)+", block: " + JSON.parse(data[0].height) + "}")
                txData.push("{ x : "+JSON.parse(data[0].time*1000) + ", y : " + totalTx +", block: " + JSON.parse(data[0].height) + "}")
                totalTx = 0;
            }
            startBlock = startBlock + 20;
        }
    }
}

setInterval(function(){
    sync(1);
},1000);

setInterval(function(){
    sync();
},10);

app.listen(8000, '0.0.0.0');
