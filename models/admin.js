const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');

//cuser schema
const AdminSchema=mongoose.Schema({
    isAdmin:{type:Boolean,required:true},
    name:{type:String,required:true},
    email:{type:String,required:true},
    password:{type:String,required:true}
});

const Admin=module.exports=mongoose.model('Admin',AdminSchema);

// store the admin information when initialization

var admin=new Admin({
    isAdmin:true,
    name:"Yi Qiang",
    email:"969461276@qq.com",
    password:"wobugaosuni"
});
Admin.findOne({email:admin.email},function(err,adminFound){
    if(err){
        console.log(err);
    }
    if(!adminFound){
        bcrypt.genSalt(10,function(err,salt){
            bcrypt.hash(admin.password,salt,function(err,hash){
                if(err){
                    console.log(err);
                }
                admin.password=hash;
                admin.save(function(err){
                if(err){
                    console.log(err);
                    return;
                }
                });
            });
        }); 
    }
});



