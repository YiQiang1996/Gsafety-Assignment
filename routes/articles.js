const express=require('express');
const router=express.Router();
const {check, validationResult}=require('express-validator');
const multer=require('multer');
const fs=require('fs');

let Article=require("../models/article");
let User=require("../models/user");


//add new article
router.get('/add',ensureAuthenticated, function(req,res){
    res.render("article/add_article",{title:"add article",messages:req.flash()});
});


//edit existing article
router.get('/edit/:id',ensureAuthenticated, function(req,res){
    var id=req.params.id;
    Article.findById(id,function(err,article){
        if(article.author==req.user._id || req.user.isAdmin){
            User.findById(article.author,function(err,user){
                let imagePathes=[];
                fs.readdir(article.imagepath,(err,files)=>{
                    if(err){
                        console.log(err);
                    }
                    files.forEach(file=>{
                        let path="/uploads/"+user._id+"/"+article.title+"/"+file;
                        imagePathes.push(path);
                    });
                });
                res.render('article/edit_article',{
                imagePathes:imagePathes,
                article:article,
                author:user.name
                });
            });
            
        }else{
            req.flash("danger","you are not authorized");
            res.redirect('/');
        }
        
    });
        
});

//process editing information
//currently only support updating the description, the other information cannot be edited

router.post('/edit/:id',ensureAuthenticated,function(req,res){

    
    let newArticle={};
    Article.findById(req.params.id,function(err,article){
        if(err){
            req.flash("error","something wrong when update the article");
            res.redirect("/articles/eidt/"+req.params.id);
        }
        //give access to the author and admin only
        if(article.author==req.user._id||req.user.isAdmin){
            //copy the information from the database, except the description
            newArticle.title=article.title;
            newArticle.author=article.author;
            newArticle.imagepath=article.imagepath;
            newArticle.timestamp=article.timestamp;
            newArticle.location=article.location;
            newArticle.description=req.body.description;

            let query={_id:req.params.id};

            Article.updateOne(query,newArticle,function(err){
                if(err){
                    console.log(err);
                    return;
                }
                else{
                    req.flash("success","Article Updated");
                    res.redirect('/');
                }
            });
        }
        else{
            req.flash("error","you are not authorized to update the article");
            res.redirect('/');
        }
    });
});



//add submit post route
var storage=multer.diskStorage({
    destination:function(req,file,cb){
        var directory="./public/uploads/"+req.user._id+"/"+req.body.title.trim();
        if(!fs.existsSync(directory)){
            fs.mkdirSync(directory,{recursive:true},(err)=>{
                console.log("cannot make more directory");
            });
        }
        cb(null,directory);
    },
    filename:function(req,file,cb){
        cb(null,file.originalname);
    }
});

//prepare for image uploading
var upload=multer({storage:storage,
                limits:{fileSize:1000000,
                        files:4},
                });

router.post('/add',upload.array('image','4'),
[check("title").not().isEmpty().withMessage("Title is required").custom((value,{req})=>{
    return Article.find({author:req.user._id,title:value.trim()}).then(article=>{
        if(article.length>0){
            return Promise.reject("You have created article with the same title");
        }
    });
}),
check("description").not().isEmpty() .withMessage("Description is required"),
check("location").not().isEmpty().withMessage("Location is required"),
check("timestamp").not().isEmpty().withMessage("Time is required")],
function(req,res){
    let errors=validationResult(req).errors;
    if(errors.length>0){
        res.render("article/add_article",{
            title:"add article",
            errors:errors
        });
    }else if(req.files.length==0){
        req.flash('error','No file selected');
        res.redirect('/articles/add');
    }else{
        let article=new Article({
                title:req.body.title.trim(),
                author:req.user._id,
                description:req.body.description,
                timestamp:req.body.timestamp,
                imagepath:"./public/uploads/"+req.user._id+"/"+req.body.title.trim(),
                location:req.body.location
            });

            article.save(function(err){
                if(err){
                    console.log(err);
                    return;
                }
                else{
                    req.flash("success","Article Added");
                    res.redirect("/");
                }
            });
    }
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

//delete the article
//only assign the author the right to delete 
// even the admin cannot delete the article
router.delete('/:id',ensureAuthenticated, function(req,res){
    if(!req.user._id){
        res.redirect("users/login");
    }
    let query={_id:req.params.id};
    Article.findOne(query,function(err,article){
        if(article.author != req.user._id){
            req.flash("danger","you are not authorized to delete");
            res.redirect("/");
        }
        else{
            //remove the article from the database
            Article.deleteOne(query,function(err){
                if(err){
                console.log(err);
                }
                //remove the folder the hold the image of that article
                let path="./public/uploads/"+req.user._id+"/"+article.title.trim()+"/";
                deleteFolderRecursive(path);

                req.flash("success","Article Deleted");
                res.send("Success");
            });
        }
    });
});

//get single article
router.get('/:id',ensureAuthenticated, function(req,res){
    Article.findById(req.params.id,function(err,article){
        //admin and the owner can view the article
        if(article.author ==req.user._id||req.user.isAdmin){
            User.findById(article.author,function(err,user){
                let imagePathes=[];
                fs.readdir(article.imagepath,(err,files)=>{
                    if(err){
                        console.log(err);
                    }
                    files.forEach(file=>{
                        let path="/uploads/"+user._id+"/"+article.title+"/"+file;
                        imagePathes.push(path);
                    });
                });
                res.render('article/article',{
                    article:article,
                    author:user.name,
                    imagePathes:imagePathes
                });
          });
           
        }
        else{
            req.flash('danger',"you are not authorized");
            res.redirect("/");
        }
    });
});

//access control
function ensureAuthenticated(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    else{
        req.flash("danger","please login");
        res.redirect('/users/login');
    }
}



module.exports=router;