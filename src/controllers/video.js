const controller = require("./user");
const path = require("node:path");
const getVideos =(req,res,handleErr)=>{
    const name = req.params.get("name");
    if(name){
        res.json({message:`Your name is ${name}`});

    }else{
        return handleErr({status:400 ,message:"Please specify a name."});
    }
    
}
const uploadVideo= (req,res,handleErr)=>{
    const specifiedFilename = req.headers.filename;
    if (!specifiedFilename) {
      return handleErr({ status: 400, message: "Filename is missing in headers." });
    }
   
    const extension = path.extname(specifiedFilename).substring(1).toLowerCase();
    const name = path.parse(specifiedFilename).name;
    console.log(specifiedFilename, extension, name);
  
}

const controllers={
    getVideos,
    uploadVideo,
};
module.exports =controllers;