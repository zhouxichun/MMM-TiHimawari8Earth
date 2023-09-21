/* MMM-TiHimawari8Earth.js
 *
 * Magic Mirror
 * Module: MMM-TiHimawari8Earth
 *
 * Magic Mirror By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 *
 * Module MMM-Slideshow By Zhou Xichun
 * MIT Licensed.
 */
Module.register('MMM-TiHimawari8Earth', {
  defaults: {
    baseUrl: "https://himawari8-dl.nict.go.jp/himawari8/img/D531106/1d/550/",
    lastestUrl: "https://himawari8-dl.nict.go.jp/himawari8/img/FULL_24h/latest.json",
    maxEntries: 40,
    fetchInterval: 10*60*1000,
    
    updateInterval: 60 * 1000,
    // the speed at which to switch between images, in milliseconds 
    animationSpeed: 50,
    imageWidth:'550px',
    imageHeight:'550px',
    grayscale: false
  },

  start: function () {
    // add identifier to the config
    this.config.identifier = this.identifier;  
  },

  getScripts: function () {
    return ['moment.js'];
  },

  getStyles: function () {
    return ['MMM-TiHimawari8Earth.css'];
  },

  // notification handler
  notificationReceived: function (notification, payload, sender) {

  },

  // the socket handler
  socketNotificationReceived: function (notification, payload) {
    if (notification === 'TIHIMAWARI8EARTH_IMAGE_UPDATED') {
      this.displayImage(payload);
    } else{
      Log.log(this.name + ": received a system notification: " + notification);
    }
  },

  // Override dom generator.
  getDom: function () {
    var wrapper = document.createElement('div');
    imagesDiv = document.createElement('div');
    imagesDiv.className = 'images';
    this.imageDiv = document.createElement('div');
    this.imageDiv.className = this.config.grayscale ? 'image imageGray' : 'image ';
    this.imageDiv.style.height = this.config.imageHeight;
    this.imageDiv.style.width = this.config.imageWidth;
    imagesDiv.appendChild(this.imageDiv);
    wrapper.appendChild(imagesDiv);
    this.sendSocketNotification('TIHIMAWARI8EARTH_START_WORK',this.config);
    return wrapper;
  },

  displayImage: function (imageData) {  
    const image = new Image();
    image.src = imageData;
    image.onload = () => {  
      this.imageDiv.style.backgroundImage = `url("${image.src}")`;
    };    
  },
});
