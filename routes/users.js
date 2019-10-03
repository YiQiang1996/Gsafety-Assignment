const express=require('express');
const router=express.Router();
const {body, validationResult}=require('express-validator');
const bcrypt=require('bcryptjs');
const passport=require('passport');

let User=require('../models/user');

//register form
router.get('/register',function(req,res){
    res.render('user/register');
});
//register process
router.post('/register',[body("name").not().isEmpty().withMessage("name is requried"),
body('email').isEmail().withMessage("Email is invalid").custom(value=>{
    return User.find({email:value}).then(emails=>{
        if(emails.length>0){
            return Promise.reject("Email has been used, please try another email");
        }
    });
}), 
body('password').not().isEmpty().withMessage("Password is required").isLength({min:8}).withMessage("password must at least contains 8 characters"),
body('password2').custom((value,{req})=>{
    if(value!=req.body.password){
        throw new Error("Password confirmation does not match password");
    }
    return true;
})],
function(req,res){

    let errors=validationResult(req).errors;
    v=console.log(errors);
    if(errors.length>0){
        res.render('user/register',{
            errors:errors
        });
    }else{
        let newUser=new User({
            name:req.body.name,
            email:req.body.email,
            password:req.body.password
        });

        bcrypt.genSalt(10,function(err,salt){
            bcrypt.hash(newUser.password,salt,function(err,hash){
                if(err){
                    console.log(err);
                }
                newUser.password=hash;
                newUser.save(function(err){
                    if(err){
                        console.log(err);
                        return;
                    }
                    else{
                        req.flash('success',"You are now registered and now can login");
                        res.redirect('/users/login');
                    }
                });
            });
        }); 

    }
  
});

router.get('/login',function(req,res){
    res.render('user/login',{messages:req.flash()});
});


// user can see their own information and update the information,
// but currently no time for this function, leave it to next time


// router.get('/profile',function(req,res){
//     if(!req.user){
//         req.flash("info","Please login first");
//         res.redirect('/users/login');
//     }
//     else{
//     User.findOne({_id:req.user._id},function(err,user){
//         res.render('user_profile',{user:user});
//     }); 
//     }
// });

//login process
router.post('/login',function(req,res,next){
    passport.authenticate('local',{
        successRedirect:'/',
        failureRedirect:'/users/login',
        failureFlash:true
    })(req,res,next);
});

router.get('/logout',function(req,res){
    req.logout();
    req.flash('success','you are logged out');
    res.redirect('/users/login');
});

module.exports=router;