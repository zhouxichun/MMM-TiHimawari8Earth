const Log = require("logger");
const NodeHelper = require('node_helper');
const fetch = require("fetch");
const moment = require("moment");
const fs = require('fs');

module.exports = NodeHelper.create({
  start: function(){
    // timer for fetch data from himawari8 website.
    this.fetchTimer = null;
    // timer for update images display on screen.
    this.updateTimer = null;
    // if ture, updating is block.
    this.isFetching = false;
    // if ture, fetching is block.
    this.isUpdating = false;
    // images will be displayed on screen.
    this.images = [];
    // file where images data saved.
    this.dataFile = this.path + "/data.json";
    this.readImagesFromFile();
  },
  
  socketNotificationReceived: function (notification, payload) {
    if (notification === 'TIHIMAWARI8EARTH_START_WORK') {
      this.config = payload;
      //start data fetching right now.
      setTimeout(()=>{
        this.fetchData();
      },100);}
  },
  /**
   * fetch data from website.
   * @returns 
   */
  fetchData: function()
  {
    if(this.isUpdating){
      this.scheduleFetchTimer(3000);//retry in 3s.
      return;
    }
    this.isFetching = true;
    Log.info(this.name+": fetching data.");

    fetch(this.config.lastestUrl)
    .then(this.checkFetchStatus)
		.then((response) => response.text())
    .then((responseData) => {
				const date = new Date(JSON.parse(responseData).date);
        for(let i=0;i<this.config.maxEntries;i++)
        {
          let d = new Date(date.getTime()-i*10*60*1000);
          let imageId = moment(d).format('yyyy/MM/DD/HHmm00_0_0');
          if(this.images.find(a=>{return a.id == imageId})==undefined){
            this.images.push({
              id:imageId,data:null
            });
          }
        }
        this.images.sort((a,b)=>{return a.id>b.id?-1:1});
        this.images = this.images.splice(0, this.config.maxEntries);
        this.fillImageData();
      })
    .catch((error) => {
        Log.info(this.name + ": Failed to fetch data [lastest json].");
        Log.info(this.name + ": " + error)
        this.scheduleFetchTimer(3000);//retry in 3s.
      });
  },

  fillImageData: function(){
    var item = this.images.find((item)=>{return item.data==null});
    if( item ){
      var url = this.config.baseUrl + item.id + '.png';
      fetch(url)
      .then(this.checkFetchStatus)
      .then(response=>response.arrayBuffer())
      .then(arrBuffer=>{
        const	base64	= btoa(new Uint8Array(arrBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
        item.data = 'data:image/png;base64,' + base64;
        setTimeout(()=>{this.fillImageData()},100);
        Log.info(this.name+": " + item.id + ".png loaded.");
      })
      .catch((error) => {
          Log.info(this.name+": Failed to fetch data [image data].");
          this.scheduleFetchTimer(this.config.fetchInterval);
      });
    }
    else{
      Log.info(this.name + ": Succeed fetch data.");
      this.writeImagesToFile();
      this.scheduleFetchTimer(this.config.fetchInterval);
      //update images on screen right now.
      this.scheduleUpdateTimer(100);
    }
  },
/**
 * 
 * @param {index of the image will be displayed on screen.} index 
 * @returns 
 */
  updateImages: function (index) {
    if(this.isFetching){
      this.scheduleUpdateTimer(3000);//retry in 3s.
      return;
    }
    this.isUpdating = true;
    if(index < 0)
    {
      this.scheduleUpdateTimer(this.config.updateInterval);
      return;
    }else{
      this.sendSocketNotification('TIHIMAWARI8EARTH_IMAGE_UPDATED',this.images[index].data);
      setTimeout(()=>{this.updateImages(--index)},this.config.animationSpeed);}
  },
  /**
   * 
   */
  writeImagesToFile: function(){
    const writeStream = fs.createWriteStream(this.dataFile)
    .on('finish', () => {
      Log.info(this.name + ': wrote image data to file.');})
    .on('error', (err) => {
        Log.info(this.name + `: There is an error writing the file => ${err}`);});
    writeStream.write(JSON.stringify(this.images));
    writeStream.end();
  },
/**
 * 
 */
  readImagesFromFile: function(){
    var data = '';
    fs.createReadStream(this.dataFile)
    .on('end', () => {
      this.images = JSON.parse(data)})
    .on('data', (chunk) => {
        data += chunk;
    });
  },
/**
 * 
 * @param {*} interval 
 */
  scheduleFetchTimer: function (interval) {
    this.isFetching = false;
		clearTimeout(this.fetchTimer);
		this.fetchTimer = setTimeout(()=>{
			this.fetchData();
		}, interval);
	},
/**
 * 
 * @param {*} interval 
 */
  scheduleUpdateTimer: function (interval) {
    this.isUpdating = false;
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(()=>{
			this.updateImages(this.images.length-1);
		}, interval);
	}
});