const LocalStrategy=require('passport-local').Strategy;
const User=require('../models/user');
const Admin=require('../models/admin');
const config=require('../config/database');
const bcrypt=require('bcryptjs');

module.exports=function(passport){
    //local strategy for normal users
    passport.use('local',new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
      },function(username,password,done){
         let query={email:username};
         User.findOne(query,function(err,user){
             if(err) throw err;
             if(!user){
                 return done(null,false,{message:'no user found, please register'});
             }
             //match the password
             bcrypt.compare(password,user.password,function(err,isMatch){
                 if(err) throw err;
                 if(isMatch){
                     return done(null,user);
                 }else{
                     return done(null,false,{message:"wrong password"});
                 }
             });

         });
    }));

    //local strategy for admin

    passport.use('local-admin',new LocalStrategy({
        usernameField:'email',
        passwordField:'password'
    },
    function(username,password,done){
        Admin.findOne({email:username},function(err,admin){
            if(err) throw err;
            if(!admin){
                return done(null,false,{message:"Wrong Email"});
            }

             //match the password
             bcrypt.compare(password,admin.password,function(err,isMatch){
                if(err) throw err;
                if(isMatch){
                    return done(null,admin);
                }else{
                    return done(null,false,{message:"wrong password"});
                }
            });

        });
    }));

    passport.serializeUser(function(user,done){
        done(null, user.id);
    });

    passport.deserializeUser(function(id,done){
        Admin.findById(id,function(err,admin){
            if(admin){
               done(err,admin); 
            }
            else{
                User.findById(id,function(err,user){
                    done(err,user);
                })
            }
        });
    });
}
