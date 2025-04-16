const controller = require("./user");
const path = require("node:path");
const fs= require("node:fs/promises");
const crypto=  require("node:crypto");
const {pipeline}= require("node:stream/promises");
const util = require("../../lib/util");

const DB = require("../DB")







const getVideos =(req,res,handleErr)=>{
    const name = req.params.get("name");
    if(name){
        res.json({message:`Your name is ${name}`});

    }else{
        return handleErr({status:400 ,message:"Please specify a name."});
    }
    
}
const uploadVideo= async (req,res,handleErr)=>{
    const specifiedFilename = req.headers.filename;
    if (!specifiedFilename) {
      return handleErr({ status: 400, message: "Filename is missing in headers." });
    }
   
    const extension = path.extname(specifiedFilename).substring(1).toLowerCase();
    const name = path.parse(specifiedFilename).name;
    const videoId= crypto.randomBytes(4).toString("hex");

    try{
   //we are grabbing the video id then make folder with same name
    await fs.mkdir(`./storage/${videoId}`);
    //original video path

    const fullPath = `./storage/${videoId}/original.${extension}`;
    //now we can create file at full path location
    const file = await fs.open(fullPath,"w");
    //now we want to write in file so we have to create a write stream
    const fileStream = file.createWriteStream();
    await pipeline(req,fileStream);

 

    //updating our db
    DB.update();
    DB.video.unshift({
        id:DB.video.length,
        videoId,
        name,
        extension,
        userId:req.userId,
        extractedAudio:false,
        resizes:{}
    })
    DB.save();

    res.status(200).json({
        status:"sucess",
        message:"File was uploaded sucssuflly"
    })











    }catch(e){
        //Delete the whole folder
util.deleteFolder(`./storage/${videoId}`);
if(e.code!=="ECONNRESET")return handleErr(e);

    }

 




    console.log(specifiedFilename, extension, name);
  
}

const controllers={
    getVideos,
    uploadVideo,
};
module.exports =controllers;