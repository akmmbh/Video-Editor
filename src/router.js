// Controllers
const User = require("./controllers/user.js");
const Video =require("./controllers/video.js");
module.exports = (server) => {
  // ------------------------------------------------ //
  // ************ USER ROUTES ************* //
  // ------------------------------------------------ //

  // Log a user in and give them a token
  server.route("post", "/api/login", User.logUserIn);

  // Log a user out
  server.route("delete", "/api/logout", User.logUserOut);

  // Send user info
  server.route("get", "/api/user", User.sendUserInfo);

  // Update a user info
  server.route("put", "/api/user", User.updateUser);

  //upload a video file
  server.route("get", "/api/videos", Video.getVideos);
  server.route("post", "/api/upload-video", Video.uploadVideo);
  //extract the audio
  server.route("patch","/api/video/extract-audio",Video.extractAudio);
  // get the video asset
  server.route("get","/get-video-asset",Video.getVideoAsset);
};
