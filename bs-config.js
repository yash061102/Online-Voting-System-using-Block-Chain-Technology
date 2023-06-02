const express =require('express')
const ejs=require('ejs')
const mongoose=require('mongoose')
const bodyparser=require('body-parser');
const { hash } = require('bcrypt');
const bcrypt=require('bcrypt')
const app=express();
app.use(express.urlencoded());
app.set('view engine','ejs');
app.use(express.urlencoded({extended:false}))
const flash = require('express-flash');
const session = require('express-session');

const url="mongodb+srv://<username>:<password>@cluster.2bdiuln.mongodb.net/test"
const passportUser=require('passport')
const passportAdmin=require('passport')

const initializePassportUser = require('./passport-config-user');
const initializePassportAdmin=require('./passport-config-admin');

initializePassportUser(
    passportUser,
    email => Voter.findOne({ email: email }),
    id => id
);
initializePassportAdmin(
    passportAdmin,
    email=>Admin.findOne({ email:email }),
    id=>id
);
app.use(flash());
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}))


app.use(passportUser.initialize());
app.use(passportUser.session());
app.use(passportAdmin.initialize());
app.use(passportAdmin.session());
async function connect(){
    try{
        await mongoose.connect(url);
        console.log("database is connected")

    }
    catch(error){
        console.log(error)

    }
}
//connection with database
connect();
//creation of schema
//voter schema 
const voterschema=new mongoose.Schema({
    Name:String,
    email:String,
    password:String,

})
//aadhar schema
const aadharschema =new mongoose.Schema({
    aadharnum:String,
    txid:String,
    isRegistered:Boolean,
})
const adminschema=new mongoose.Schema({
    email:String,
    password:String,

})
const Voter=new mongoose.model("Voter",voterschema)
const Aadhar=new mongoose.model("Aadhar",aadharschema)
const Admin=new mongoose.model("Admin",adminschema)

const saltRounds=10;

//request handling
app.post('/userlogin',passportUser.authenticate('voter',{
    
    successRedirect: '/userinfo',
    failureRedirect: '/userlogin',
    failureFlash: true
}))

app.post('/register',(req,res)=>{
    
   Voter.findOne({'email':req.body.email})
   .then((data) => {
    if(data!=null)
    {
        console.log(data)
        res.render('Registrationform',{message:"Email is already registered"})
    }
    else
    {
        bcrypt.hash(req.body.password, saltRounds).then((hash)=>{
            // Store hash in your password DB.
            const user=new Voter({
                Name:req.body.name,
                email:req.body.email,
                password:hash,
        
            })
            
                user.save().then(function(newuser){
                    console.log(newuser)
                   
                    res.render('Registrationform',{message:"User is Successfully Registered."})
            
                })
                .catch(function(error){
                    console.log(error)
                    res.render('Registrationform')
                })

        }).then((hasherror)=>{
            console.log(hasherror);
        })        
    }

   })
   .catch(function(error){
    console.log(error)
    
   })
  
   
   
})
app.post('/voterregister',(req,res)=>{
    
    //Aadhar validation
    Aadhar.findOne({ 'aadharnum': req.body.adhar }).
    then(function (data) {
        if (data != null) {
            res.render('voterregister', { message: "Aadhar number is already registered" });
        }
        else {
            Aadhar.findOne({ 'txid': req.body.txid })
                .then(function (data1) {
                    if (data1 != null) {
                        res.render('voterregister', { message: "Transation Id is already registered" });
                    }
                    else {
                        const newaadhar = new Aadhar({ aadharnum: req.body.adhar, txid: req.body.txid, isRegistered: true, })
                        newaadhar.save().
                            then(function (data) {
                                console.log(data);
                                res.render('voterregister', { message: "User is Registered Successfully" });
                            })
                            .catch(function (error1) {
                                console.log(error1)
                                res.redirect('/voterregister');
                            })
                    }
                })
                .catch(function (error) {
                    console.log(error)
                    res.redirect('/voterregister');
                })
        }
    })
    .catch(function (error) {
        console.log(error)
        res.redirect('/voterregister')
    })
})
app.post('/adminlogin', passportAdmin.authenticate('admin',{
    successRedirect: '/adminvoterreg',
    failureRedirect: '/adminlogin',
    failureFlash: true
}))

app.get('/adminlogin',(req,res)=>{
    res.render('adminlogin')
})

//routes
app.get('/result',checkAuthenticatedUser,(req,res)=>{
    res.sendFile(__dirname+'/result.html')
})
app.get('/adminlanding',checkAuthenticatedUser,(req,res)=>{
    res.render('adminlandingpage')
})
app.post('/userlogout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

app.post('/adminlogout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });

app.get('/votingarea',checkAuthenticatedUser,(req,res)=>{
    res.sendFile(__dirname+'/voting-area.html')
})
app.get('/Candidatedetails',checkAuthenticatedAdmin,(req,res)=>{
    res.sendFile(__dirname+'/Candidatedetails.html')

})
app.get('/changephase',checkAuthenticatedAdmin,(req,res)=>{
    res.sendFile(__dirname+'/changephase.html')

})
app.get('/addcandidate',checkAuthenticatedAdmin,(req,res)=>{
    res.sendFile(__dirname+'/addcandidate.html')
})
app.get('/adminlogin',checkAuthenticatedAdmin, (req, res) => {
    res.render('adminvoterreg')
})
app.get('/adminlogin',checkNotAuthenticatedAdmin,(req,res)=>{
    res.render('adminlogin')
})
app.get('/userlogin',checkNotAuthenticatedUser,(req,res)=>{
    res.render('loginform')
})
app.get('/userlogin',checkAuthenticatedUser,(req,res)=>{
    res.render('userinfo')
})
app.get('/',(req,res)=>{
    res.render('home')
})

app.get('/register',(req,res)=>{
    res.render('Registrationform')
})
app.get('/voterregister',checkAuthenticatedUser,(req,res)=>{
    res.render('voterregister')
})
app.get('/userinfo',checkAuthenticatedUser,(req,res)=>{
    Voter.findOne({'_id': req.user}).then(function(data){
        if(data!=null){
            console.log(data);
            res.render('userinfo',{user:data})
        }
    })
    res.render('userinfo')
})

app.get('/adminvoterreg',(req,res)=>{
   Aadhar.find().then(function(data){
    console.log(data)
    res.render('adminvoterreg',{userdata:data})
   })
   .then(function(error){
    console.log(error)
   })
    
})
function checkAuthenticatedUser(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/userlogin')
}

function checkNotAuthenticatedUser(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/userinfo')
    }
    next()
}
function checkAuthenticatedAdmin(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }
    res.redirect('/adminlogin')
}

function checkNotAuthenticatedAdmin(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/adminvoterreg')
    }
    next()
}
//app start listing
module.exports = {
    "server": {
      "baseDir": ["./", "./build/contracts"],
      "routes": {
        "/node_modules": "node_modules"
      },
      middleware: {
        1: app,
    },
  },
  port: 3000
  };
  

