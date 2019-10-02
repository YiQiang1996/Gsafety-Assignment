const express=require("express");
const path=require('path');
const expressHbs=require("express-handlebars");
const mongoose=require('mongoose');
const bodyParser=require('body-parser');
const flash=require('connect-flash');
const session=require('express-session');
const passport=require('passport');
const config=require('./config/database');


mongoose.connect(config.database,{useNewUrlParser:true});
let db=mongoose.connection;
//check for db errors
db.on("open",function(){
    console.log("Connected to MongoDB");
})

db.on("error",function(err){
    console.log(err);
});

//Init App
const app=express();

//bring in models
let Article=require("./models/article");

app.engine(".hbs",expressHbs({layoutsDir:'views/layouts',defaultLayout:"layout",extname:"hbs"}));
//app.set('views',path.join(__dirname,'views'));
app.set('view engine','.hbs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//set public folder
app.use(express.static(path.join(__dirname,'public')));

// express-session midware
app.use(session({
    secret:"wocaonima",
    resave:false,
    saveUninitialized:false,
    cookie:{maxAge:null}
}));

//Express message middleware
app.use(flash());

//Express validator middleware
// app.use(expressValidator({
//     errorFormatter:function(param,msg,value){
//         var namespace=param.split('.'),
//         root=namespace.shift(),
//         formParam=root;
        
//         while(namespace.length){
//             formParam+='['+namespace.shift()+']';
//         }
//         return{
//             param:formParam,
//             msg:msg,
//             value:value
//         };
//     }
// }));

//passport configuration
require('./config/passport')(passport);
//passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.get("*",function(req,res,next){
    res.locals.user=req.user||null;
    next();
});

app.get("/",ensureAuthenticated, function(req,res){
    if(req.user.isAdmin){
        res.redirect('/admins/index');
    }
    else{
        Article.find({author:req.user._id},function(err,articles){
            if(err){
                console.log(err);
            }
            else{
                res.render('index',{
                title:"Articles",
                articles:articles,
                messages:req.flash()
                }); 
            }
        }); 
    }      
});

let articleRoute=require("./routes/articles");
let userRoute=require("./routes/users");
let adminRoute=require("./routes/admins");
app.use('/articles',articleRoute);
app.use('/users',userRoute);
app.use('/admins',adminRoute);

//access control
function ensureAuthenticated(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    else{
        req.flash("danger","please login or register");
        res.redirect('/users/login');
    }
}

app.listen(3000,function(){
    console.log("Server started listening inport 3000...")
});