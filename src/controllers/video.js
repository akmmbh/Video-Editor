const controller = require("./user");
const path = require("node:path");
const fs= require("node:fs/promises");
const crypto=  require("node:crypto");
const {pipeline}= require("node:stream/promises");
const util = require("../../lib/util");
const DB = require("../DB")
const FF= require("../../lib/FF");







//Return the list fo all the videos

const getVideos =(req,res,handleErr)=>{
   const videos =DB.video.filter((videos)=>{
return videos.userId===req.userId;
   })
    res.status(200).json(videos);
}
const uploadVideo= async (req,res,handleErr)=>{
    const specifiedFilename = req.headers.filename;
    if (!specifiedFilename) {
      return handleErr({ status: 400, message: "Filename is missing in headers." });
    }
   
    const extension = path.extname(specifiedFilename).substring(1).toLowerCase();
    const name = path.parse(specifiedFilename).name;
    const videoId= crypto.randomBytes(4).toString("hex");
 const FORMATS_SUPPORTED = ["mp4", "mkv", "avi", "mov", "flv", "wmv"];
 if(FORMATS_SUPPORTED.indexOf(extension)==-1){
    return handleErr({
        status:400,
        message:"File format is not supported"
    })
 }
    try{
   //we are grabbing the video id then make folder with same name
    await fs.mkdir(`./storage/${videoId}`);
    //original video path

    const fullPath = `./storage/${videoId}/original.${extension}`;
    //now we can create file at full path location
    const file = await fs.open(fullPath,"w");
    //now we want to write in file so we have to create a write stream
    const fileStream = file.createWriteStream();
     
    const thumbnailPath = `./storage/${videoId}/thumbnail.jpg`;
    await pipeline(req,fileStream);
     

    //Make a thumbnail for the video file
  await FF.makeThumbnail(fullPath,thumbnailPath);


   //Get the dimenstions
 const dimensions= await FF.getDimenstions(fullPath);


    //updating our db
    DB.update();
    DB.video.unshift({
        id:DB.video.length,
        videoId,
        name,
        extension,
        dimensions,
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
//Extract the audio for the vidoe file which can only be done once per video
const extractAudio= async(req,res,handleErr)=>{
    try{
    const videoId= req.params.get("videoId");

    DB.update();
    const video=DB.video.find((videos)=>videos.videoId===videoId)
    if(video.extractedAudio){
        return handleErr({
            status:400,
            message:"the audio has already been extracted for this video"
        });
    }
    const originalVideoPath=`./storage/${videoId}/original.${video.extension}`;
    const targetAudioPath=`./storage/${videoId}/audio.aac`;
    await FF.extractAudio(originalVideoPath,targetAudioPath);
    video.extratedAudio=true;
    DB.save();
    res.status(200).json({
        status:"success",
        message:"the Audion was extracted successfully"
    });
}catch(e){
util.deleteFile(targetAudioPath);
return handleErr(e);
}
}


const resizeVideo = async(req,res,handleErr)=>{
    const videoId=req.body.videoId;
    const width = Number(req.body.width);
    const height = Number(req.body.height);
    DB.update();
    const video= DB.video.find((videos)=>videos.videoId ===videoId);
   const originalVideoPath =`./storage/${video.videoId}/original.${video.extension}`;
const targetVideoPath=`./storage/${video.videoId}/${width}x${height}.${video.extension}`;
 try{
     video.resizes[`${width}x${height}`]={processing:true};


await FF.resizeVideo(
    originalVideoPath,
    targetVideoPath,
    width,
    height,
)
video.resizes[`${width}x${height}`].processing=false;
DB.save();

     res.status(200).json({
        status:"success",
        message:"the video is now beign processed"
     })
    }catch(e){
        util.deleteFile(targetVideoPath);
  return handleErr(e);
    }
}

const getVideoAsset= async(req,res,handleErr)=>{
const videoId = req.params.get("videoId");
const type = req.params.get("type");

DB.update();
const video =DB.video.find((videos)=> videos.videoId ===videoId);
if(!video){
    return handleErr({
        status:404,
        message:"video not found"
    })
}

let file;
let mimeType;
let filename;
switch(type){
    case "thumbnail":
        file = await fs.open(`./storage/${videoId}/thumbnail.jpg`,"r");
        mimeType = `image/jpeg`;
        break;
    //audio
    case "audio":
        file = await fs.open(`./storage/${videoId}/audio.aac`,"r");
        mimeType="audio/aac";
        filename= `${video.name}-audio.aac`;
        break;

    //resize
    case "resize":
        const dimensions=req.prams.get("dimensions");
        file= await fs.open(`./storage/${videoId}/${dimensions}.${video.extension}`,"r");
        mimeType=`video/mp4`;
        filename=`${video.name}-${dimensions}.${video.extension}`;
        break;
    //original
    case "original":
    file= await fs.open(`./storage/${videoId}/original.${video.extension}`,"r");
    mimeType="video/mp4";
    filename=`${video.name}.${video.externsion}`;
    break;

}

    
    //grab the file size;
    const stat= await file.stat();
    const fileStream= file.createReadStream();
if(type!=="thumbnail"){
    //Set a header to promt for download
    res.setHeader("Content-Disposition",`attachment; filename=${filename}`)
}
    //set the content type header based on the file type 
    res.setHeader("Content-Type",mimeType);
    //set the content length to the size of the file 
    res.setHeader("Content-Length",stat.size);

    res.status(200);
    await pipeline(fileStream,res);
    file.close();

}
const controllers={
    getVideos,
    uploadVideo,
    getVideoAsset,
    extractAudio,
    resizeVideo,
};
module.exports =controllers;