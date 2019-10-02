const mongoose=require('mongoose');

//article schema
let articleSchema=mongoose.Schema({
    title:{type:String,required:true},
    author:{type:String,require:true},
    description:{type:String,required:true},//description
    timestamp:{type:String,required:true},
    location:{type:String,required:true},
    imagepath:{type:String,required:true}
});

let Article=module.exports=mongoose.model("Article",articleSchema);

 