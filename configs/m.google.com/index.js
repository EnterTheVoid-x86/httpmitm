const net = require('net');
const handlers = require('../../handlers');
const path = require('path');
const express = require('express');
const axios = require('axios').default;
/**
 * 
 * @param {import("../../proxy").FilterInfo} f 
 */
function filter(f) {
    console.log(f.tls);
    if (f.tls) {
        return true;
    }
    return false;
}

const app = express();
app.post("/*", function (req, res) {
    const dat = Buffer.alloc(parseInt(req.header('Content-Length')));
    var ptr = 0
    req.on('data', (buf)=>{
        dat.set(buf, ptr);
        ptr += buf.length;
    });
    req.on('end', async ()=>{
        try {
        const resFromRev = await axios.post('http://localhost:3040/', dat);
        // console.log(resFromRev.data);
        res.writeHead(200, "OK");
        res.end(resFromRev.data.toString());
        } catch {
            res.writeHead(500, "Internal server error");
            res.end("500 - Internal server error. Try again later");
        }
        
    })
});
app.get('/*', (req, res)=>{
    res.writeHead(200, "OK");
    res.end("OK");
})
/**
 * 
 * @param {import("../../proxy").ServerConfig} config 
 * @param {net.Socket} sock 
 */
function proxy(config, sock){
    const ms = handlers.getMiniServer(function (req, res) {
        app(req, res);
    }, path.resolve(__dirname, "public", "google.com.pem"),path.resolve(__dirname, "public", "google.com.key"))
    const socks = net.createConnection({
        host: "localhost",
        port: ms.port
    }, function(){
        sock.write('HTTP/1.1 200 OK\r\n\n');
        sock.pipe(socks);
        socks.pipe(sock);
    // sock.write('HTTP/1.1 200 OK\r\n\n');
    });

}
module.exports = {
    filter,
    proxy
}
