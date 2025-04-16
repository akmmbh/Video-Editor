const fs = require("node:fs/promises")
const util ={}
 //Delete the file if exits , if not the ucnction will not thoruw an erorr
 util.deleteFile= async (path) =>{
    try{
        await fs.unlink(path);
    }
    catch(e){
        //do nothing
    }
 }

//Delete the folder if exits ,if not th functio will not thrw error
util.deleteFolder = async(path)=>{
    try{
  await fs.rm(path,{recursive:true});
    }catch(e){
//do nothing 
    }


}
module.exports =util;