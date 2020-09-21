var express = require('express');
var router = express.Router();
var {url,mongoClient}=require("../config")
var bcrptjs=require("bcryptjs")
const jwt=require("jsonwebtoken")
var nodemailer = require('nodemailer');

const {authenticate}=require("../common/auth")
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
//...........................................................................................
router.post('/register', async function(req, res, next) {
  var client=await mongoClient.connect(url,{useUnifiedTopology: true })
  var db=client.db("login")
  var user=await db.collection("users").findOne({"email":req.body.email})
  if(user){
    res.json({
      message:"User already exist"
    })
  }
else{
  var salt=await bcrptjs.genSalt(10)
  var hash=await bcrptjs.hash(req.body.password,salt)
  req.body.password=hash

  await db.collection("users").insertOne(req.body)
  res.json({
    message:"inserted"
  })
}
});
//........................................................................................
router.post('/login', async function(req, res, next) {
  try{var client=await mongoClient.connect(url,{useUnifiedTopology: true })
  var db=client.db("login")
  var user=await db.collection("users").findOne({"email":req.body.email})
if(user){

  var result=await bcrptjs.compare(req.body.password,user.password)
  
  if(result){
    let token=jwt.sign({id:1},"12345")
    res.json({
      message:"allow",
      token
    })}else{
      res.json({
        message:"wrong password"
      })
    }
  }
else{
  res.json({
    message:"no user found"
  })
}}catch(err){console.log(err)}

});
//.........................................................................................
router.post('/reset', async function(req, res, next) {
  try{var client=await mongoClient.connect(url,{useUnifiedTopology: true })
  var db=client.db("login")
  var user=[]
  var userdata=await db.collection("users").find({}).toArray()
  userdata.forEach((obj)=>{
    if("token" in  obj)
    user.push(obj)
  })
  console.log(user)
  
if(user){

  var salt=await bcrptjs.genSalt(10)
  var hash=await bcrptjs.hash(req.body.password,salt)
  req.body.password=hash

  var update=await db.collection("users").findOneAndUpdate({"token":user[0].token},{$set:{"password":req.body.password}})
 console.log(update)
 var unset=await db.collection("users").findOneAndUpdate({"token":user[0].token},{$unset:{"token":""}})
  res.json({
    message:"password updated"
  })
  
  }
else{
  res.json({
    message:"no user found"
  })
}}catch(err){console.log(err)}

});
//............................................................................
router.post('/sendmail', async function(req, res, next) {
  try{var client=await mongoClient.connect(url,{useUnifiedTopology: true })
  var db=client.db("login")
  var user=await db.collection("users").findOne({"email":req.body.user_ID})
 if(user){
  var rand=Math.random().toString(36).slice(2)
  var update=await db.collection("users").findOneAndUpdate({"email":req.body.user_ID},{$set:{"token":rand}})
  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'bitlyappexe@gmail.com',
      pass: 'QWE123rty'
    }
  });
  
  var mailOptions = {
    from: 'bitlyappexe@gmail.com',
    to:req.body.email,
    subject: 'Password reset authentication',
    text:`https://longshorturl.herokuapp.com/users/verify/${rand}`
  };
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      res.json({
        message:"Mail sent",
        random:`${rand}`
    
      })
    }
  });
 
  
 }
else{
  res.json({
    message:"no user found"
  })
}}catch(err){console.log(err)}

});
//........................................................................
router.get('/verify/:token',async function(req,res,next){
  var client=await mongoClient.connect(url,{useUnifiedTopology: true })
  var db=client.db("login")
  var user=await db.collection("users").findOne({"token":req.params.token})
  
  if(user)
  {
  res.render('reset');}
  else{
  res.json({
    message:"Login now"})
  }
})
//.........................................................................
router.post('/dashboard',authenticate, async function(req, res, next) {
  
var longurl=req.body.longurl
var rand=Math.random().toString(36).slice(2,7)
var shorturl=`https://longshorturl.herokuapp.com/users/${rand}`
var client=await mongoClient.connect(url,{useUnifiedTopology: true })
var db=client.db("login")
var store=await db.collection("url").insertOne({"longurl":longurl,"shorturl":shorturl,"clicks":0})
console.log("shorturl:"+shorturl)
res.json({
  "shorturl":shorturl
})


});
//.........................................................................
router.get('/:shorturl',async function(req,res,next){
try{
  var client=await mongoClient.connect(url,{useUnifiedTopology:true})
  var db=client.db("login")
  console.log(req.params.shorturl)
  var result=await db.collection("url").findOne({"shorturl":`https://longshorturl.herokuapp.com/users/${req.params.shorturl}`})
  if(result){
    
  var clicks=await db.collection("url").findOneAndUpdate({"shorturl":`https://longshorturl.herokuapp.com/users/${req.params.shorturl}`},{$set:{"clicks":result.clicks+1}})  
  var longurl=result.longurl
  console.log(longurl)
  res.redirect(`${longurl}`)
  }
  else{
    res.json({
      "message":"url not found"
    })
  }
}catch(err){console.log(err)}
})
//...........................................................................
router.post('/stats',async function(req,res,next){
  try{
    console.log("entered")
    var client=await mongoClient.connect(url,{useUnifiedTopology:true})
    var db=client.db("login")
    
    var result=await db.collection("url").find({},{"_id":0}).toArray()
    
    console.log("result"+JSON.stringify(result) ) 
    res.json(result)
    
  }
  catch(err){console.log("error"+err)}
  })

module.exports = router;
