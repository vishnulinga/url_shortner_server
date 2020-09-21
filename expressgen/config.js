var mongodb=require("mongodb")
var mongoClient=mongodb.MongoClient;
var url="mongodb+srv://vishnu:123abc@cluster0.o2tjj.mongodb.net/login?retryWrites=true&w=majority"
module.exports={url,mongoClient}