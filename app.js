require('dotenv').config()

var express = require('express');

var app = express();

const mqtt = require('mqtt')
const fs = require('fs')
var caFile = fs.readFileSync(process.env.CA_FILE);
var certFile = fs.readFileSync(process.env.MQTT_CRT);
var keyFile = fs.readFileSync(process.env.P_KEY);
console.log(caFile)
console.log(certFile)
console.log(keyFile)
var opts = {
  connectTimeout: 5000,
  ca: [ caFile ],
  cert: certFile,
  key: keyFile,
  rejectUnauthorized: false
}

const client  = mqtt.connect(process.env.MQTT_HOST, opts)
var mongodb = require('mongodb')
var MongoClient = mongodb.MongoClient
var ObjectId = mongodb.ObjectId
const uri = "mongodb://" + process.env.DB_USER + ":" + process.env.DB_PASSWORD + "@" + process.env.DB_HOST;
console.log(uri)
var db = null
var db_client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true})

db_client.connect(err => {
	console.log(err)
	if(err) return
	db = db_client.db(process.env.DB)
	// console.log(db)
  db_client.db(process.env.DB).listCollections().toArray().then(cols => console.log("Collections", cols))
	console.log("DB Connected")
})

console.log(process.env.MQTT_HOST)

client.on('error',(err) => 
	console.log(err))

client.on('connect',() => {
	console.log("MQTT Connected")
	client.subscribe('+/+/data/#', err => {
		if(err) console.log(err)
	})
})

client.on('message', (topic, message) => {
	try {
		message = JSON.parse(message)
		var splited = topic.split("/")
		message.home = splited[0] + "/" + splited[1]
		message.type = splited[3]
		Object.keys(message.value).forEach(device => {
			var datas = message.value[device]
			Object.keys(datas).forEach(value => {
				m = {}
				m.timestamp = message.timestamp
				m.home = message.home
				m.type = message.type
				m.device = device
				m.valueKey = value
				m.value = datas[value]
				db.collection('data').insertOne(m)
			})
		})
		

	} catch(e) {
		console.log(e)
	}
})




module.exports = app;
