const DB= require("../src/DB");
const FF = require("./FF");
const util = require("./util");
class JobQueue{

    constructor(){
        this.jobs=[];
        this.currentJob=null;
    }
    enqueue(job){
        this.jobs.push(job);
    }
    dequeue(){
        //return this.jobs.pop();
        return this.jobs.shift();
    }
    executeNext(){
   if(this.currentJob){
            return;
        }
        this.currentJob=this.dequeue();
        if(!this.currentJob){
            return;
        }
        this.execute(this.currentJob);
    }
    async execute(job){
        //ffmpeg logic
        if(job.type==="resize"){
              DB.update();
            const {width,height,videoId}=job; 
            const video= DB.video.find((videos)=>videos.videoId ===videoId);
            

            const originalVideoPath =`./storage/${video.videoId}/original.${video.extension}`;
            const targetVideoPath=`./storage/${video.videoId}/${width}x${height}.${video.extension}`;
            try{
 

await FF.resizeVideo(
    originalVideoPath,
    targetVideoPath,
  width,
    height,
)
DB.update();
const video= DB.video.find((videos)=>videos.videoId ===videoId);
            
video.resizes[`${width}x${height}`].processing=false;
DB.save();
            }catch(e){
                util.deleteFile(targetVideoPath);
             
            }
        }

this.currentJob=null;
this.executeNext();  
    } 
}
module.exports= JobQueue;