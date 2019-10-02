const express=require('express');
const router=express.Router();
const {body, validationResult}=require('express-validator');
const bcrypt=require('bcryptjs');
const passport=require('passport');
const fs=require('fs');

let Article=require('../models/article');
let User=require('../models/user');

router.get('/login',function(req,res){
    res.render('admin/login',{messages:req.flash()});
});

router.get('/logout',function(req,res){
    req.logout();
    req.flash('success','you are logged out');
    res.redirect('/admins/login');
});

router.post('/login',function(req,res,next){
    passport.authenticate('local-admin',{
        successRedirect:'/admins/index',
        failureRedirect:'/admins/login',
        failureFlash:true
    })(req,res,next);
});

router.get("/index",ensureIsAdmin,function(req,res){
    User.find({},function(err,users){
        if(err){
            console.log(err);
        }
        else{
            res.render('admin/index',{
            users:users,
            messages:req.flash()
            }); 
        }
    }); 
});

router.get("/add_user",ensureIsAdmin,function(req,res){
    res.render("admin/add_user");
});

//add new user to the database and show
//should inform the user (password) using email after adding the user,
//this function will later be implemented
router.post('/add_user',ensureIsAdmin,[body("name").not().isEmpty().withMessage("name is requried"),
body('email').isEmail().withMessage("Email is invalid").custom(value=>{
    return User.find({email:value}).then(users=>{
        if(users.length>0){
            return Promise.reject("Email has been used, please try another email");
        }
    });
}), 
body('password').not().isEmpty().withMessage("Password is required").isLength({min:8}).withMessage("password must at least contains 8 characters")],
function(req,res){
    let errors=validationResult(req).errors;
    v=console.log(errors);
    if(errors.length>0){
        res.render('admin/add_user',{
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
                        req.flash('success',"Success, new user added");
                        res.redirect('/');
                    }
                });
            });
        }); 

    }
  
});


router.get("/check_user/:id",ensureIsAdmin, function(req,res){
    User.findById(req.params.id,function(err,user){
        if(err){
            console.log(err);
        }
        Article.find({author:user._id},function(err,articles){
            if(err){
                console.log(err);
            }
            res.render("admin/check_user",{
                articles:articles,
                user_checked:user,
                noArticles:articles.length==0
            });
        });
    });
});

//function that remove the directory
var deleteFolderRecursive = function(path) {
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach(function(file, index){
        var curPath = path + "/" + file;
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          deleteFolderRecursive(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
};


router.delete("/delete_user/:id",ensureIsAdmin,function(req,res){
    User.deleteOne({_id:req.params.id},function(err){
        if(err){
            console.log("something goes wrong when deleting user: "+req.params.id);
            res.flash("error","something goes wrong when deleting user "+req.params.id);
            res.redirect("/");
        }
        //delete user successfully
        //delete the folder that contains the images also
        var imagePath="./public/uploads/"+req.params.id+"/";
        deleteFolderRecursive(imagePath);

        req.flash("success","user deleted");
        res.send('Success');
    });
});

function ensureIsAdmin(req,res,next){
    if(req.isAuthenticated() && req.user.isAdmin){
        return next();
    }
    else{
        req.flash("danger","please login");
        res.redirect('/admins/login');
    }
}

module.exports=router;
