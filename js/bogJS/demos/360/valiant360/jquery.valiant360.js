/*! jquery.valiant360 - v0.3.0 - 2014-09-16
 * http://flimshaw.github.io/Valiant360
 * Copyright (c) 2014 Charlie Hoey <me@charliehoey.com>; Licensed MIT */

/**
 * @author alteredq / http://alteredqualia.com/
 * @author mr.doob / http://mrdoob.com/
 */

var Detector = {

        canvas: !! window.CanvasRenderingContext2D,
        webgl: ( function () { try { var canvas = document.createElement( 'canvas' ); return !! window.WebGLRenderingContext && ( canvas.getContext( 'webgl' ) || canvas.getContext( 'experimental-webgl' ) ); } catch( e ) { return false; } } )(),
        workers: !! window.Worker,
        fileapi: window.File && window.FileReader && window.FileList && window.Blob,

        getWebGLErrorMessage: function () {

                var element = document.createElement( 'div' );
                element.id = 'webgl-error-message';
                element.style.fontFamily = 'monospace';
                element.style.fontSize = '13px';
                element.style.fontWeight = 'normal';
                element.style.textAlign = 'center';
                element.style.background = '#fff';
                element.style.color = '#000';
                element.style.padding = '1.5em';
                element.style.width = '400px';
                element.style.margin = '5em auto 0';

                if ( ! this.webgl ) {

                        element.innerHTML = window.WebGLRenderingContext ? [
                                'Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />',
                                'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
                        ].join( '\n' ) : [
                                'Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>',
                                'Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'
                        ].join( '\n' );

                }

                return element;

        },

        addGetWebGLMessage: function ( parameters ) {

                var parent, id, element;

                parameters = parameters || {};

                parent = parameters.parent !== undefined ? parameters.parent : document.body;
                id = parameters.id !== undefined ? parameters.id : 'oldie';

                element = Detector.getWebGLErrorMessage();
                element.id = id;

                parent.appendChild( element );

        }

};
/*!
 * Valiant360 panorama video player/photo viewer jquery plugin
 *
 * Copyright (c) 2014 Charlie Hoey <@flimshaw>
 *
 * Released under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Jquery plugin pattern based on https://github.com/jquery-boilerplate/jquery-patterns/blob/master/patterns/jquery.basic.plugin-boilerplate.js
 */

/* REQUIREMENTS:

jQuery 1.7.2 or greater
three.js r65 or higher

*/


/*!
 * jQuery lightweight plugin boilerplate
 * Original author: @ajpiano
 * Further changes, comments: @addyosmani
 * Licensed under the MIT license
 */

// the semi-colon before the function invocation is a safety
// net against concatenated scripts and/or other plugins
// that are not closed properly.
;(function ( $, THREE, Detector, window, document, undefined ) {

    // undefined is used here as the undefined global
    // variable in ECMAScript 3 and is mutable (i.e. it can
    // be changed by someone else). undefined isn't really
    // being passed in so we can ensure that its value is
    // truly undefined. In ES5, undefined can no longer be
    // modified.

    // window and document are passed through as local
    // variables rather than as globals, because this (slightly)
    // quickens the resolution process and can be more
    // efficiently minified (especially when both are
    // regularly referenced in your plugin).

    // Create the defaults once
    var pluginName = "Valiant360",
        defaults = {
            clickAndDrag: false,
            fov: 35,
            hideControls: false,
            lon: 0,
            lat: 0,
            loop: "loop",
            muted: true,
            debug: false,
            flatProjection: false,
            autoplay: true
        };

    // The actual plugin constructor
    function Plugin( element, options, callback ) {
        this.element = element;

        // jQuery has an extend method that merges the
        // contents of two or more objects, storing the
        // result in the first object. The first object
        // is generally empty because we don't want to alter
        // the default options for future instances of the plugin
        this.options = $.extend( {}, defaults, options) ;

        this._defaults = defaults;
        this._name = pluginName;

        this.callback = callback;

        this.init();
    }

    Plugin.prototype = {

        init: function() {
            // Place initialization logic here
            // You already have access to the DOM element and
            // the options via the instance, e.g. this.element
            // and this.options
            // you can add more functions like the one below and
            // call them like so: this.yourOtherFunction(this.element, this.options).

            // instantiate some local variables we're going to need
            this._time = new Date().getTime();
            this._controls = {};
            this._id = this.generateUUID();

            this._isVideo = false;
            this._isPhoto = false;
            this._isFullscreen = false;
            this._mouseDown = false;
            this._dragStart = {};

            this._lat = this.options.lat;
            this._last_lat = 0;
            this._lon = this.options.lon;
            this._last_lon = 0;
            this._lat_offset = 0;
            this._lon_offset = 0;
            this._fov = this.options.fov;
            this._firstCallFlag = true;
            this.onOrientationChange();

            // save our original height and width for returning from fullscreen
            this._originalWidth = $(this.element).find('canvas').width();
            this._originalHeight = $(this.element).find('canvas').height();

            // add a class to our element so it inherits the appropriate styles
            $(this.element).addClass('Valiant360_default');

            this.createMediaPlayer();
            this.createControls();
        },

        generateUUID: function(){
            var d = new Date().getTime();
            var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = (d + Math.random()*16)%16 | 0;
                d = Math.floor(d/16);
                return (c==='x' ? r : (r&0x7|0x8)).toString(16);
            });
            return uuid;
        },

        createMediaPlayer: function() {

            // create a local THREE.js scene
            this._scene = new THREE.Scene();

            // create ThreeJS camera
            this._camera = new THREE.PerspectiveCamera( this.options.fov, $(this.element).width() / $(this.element).height(), 0.1, 1000);

            // create ThreeJS renderer and append it to our object
            this._renderer = Detector.webgl? new THREE.WebGLRenderer(): new THREE.CanvasRenderer();
            this._renderer.setSize( $(this.element).width(), $(this.element).height() );
            this._renderer.autoClear = false;
            this._renderer.setClearColor( 0x333333, 1 );

            // append the rendering element to this div
            $(this.element).append(this._renderer.domElement);

            // figure out our texturing situation, based on what our source is
            if( $(this.element).attr('data-photo-src') ) {
                this._isPhoto = true;
                this._texture = THREE.ImageUtils.loadTexture( $(this.element).attr('data-photo-src') );
            } else {
                this._isVideo = true;
                // create off-dom video player
                this._video = document.createElement( 'video' );
                this._video.id = '360_video';
                this._video.style.display = 'none';
                $(this.element).append( this._video );
                this._video.loop = this.options.loop;
                this._video.muted = this.options.muted;
                this._texture = new THREE.Texture( this._video );

                // make a self reference we can pass to our callbacks
                var self = this;

                // attach video player event listeners
                this._video.addEventListener("ended", function() {

                });

                // Progress Meter
                this._video.addEventListener("progress", function() {
                    var percent = null;
                        if (self._video && self._video.buffered && self._video.buffered.length > 0 && self._video.buffered.end && self._video.duration) {
                            percent = self._video.buffered.end(0) / self._video.duration;
                        }
                        // Some browsers (e.g., FF3.6 and Safari 5) cannot calculate target.bufferered.end()
                        // to be anything other than 0. If the byte count is available we use this instead.
                        // Browsers that support the else if do not seem to have the bufferedBytes value and
                        // should skip to there. Tested in Safari 5, Webkit head, FF3.6, Chrome 6, IE 7/8.
                        else if (self._video && self._video.bytesTotal !== undefined && self._video.bytesTotal > 0 && self._video.bufferedBytes !== undefined) {
                            percent = self._video.bufferedBytes / self._video.bytesTotal;
                        }

                        // Someday we can have a loading animation for videos
                        var cpct = Math.round(percent * 100);
                        if(cpct === 100) {
                            // do something now that we are done
                        } else {
                            // do something with this percentage info (cpct)
                        }
                });

                // Video Play Listener, fires after video loads
                this._video.addEventListener("canplaythrough", function() {

                    if(self.options.autoplay === true) {
                        self._video.play();
                        self._videoReady = true;
                    }
                });

                // set the video src and begin loading
                if ($(this.element).attr('data-video-src')){
                    this._video.src = $(this.element).attr('data-video-src');
                }
                else if (this._video.canPlayType('video/webm')){
                    this._video.src = $(this.element).attr('data-video-webm-src');
                }
                else if (this._video.canPlayType('video/mp4')) {
                    this._video.src = $(this.element).attr('data-video-mp4-src');
                }
                else {
                    console.error("Browser seems not to be able to decode the available media content");
                }
                this._video.load();
            }

            this._texture.generateMipmaps = false;
            this._texture.minFilter = THREE.LinearFilter;
            this._texture.magFilter = THREE.LinearFilter;
            this._texture.format = THREE.RGBFormat;

            // create ThreeJS mesh sphere onto which our texture will be drawn
            this._mesh = new THREE.Mesh( new THREE.SphereGeometry( 500, 80, 50 ), new THREE.MeshBasicMaterial( { map: this._texture } ) );
            this._mesh.scale.x = -1; // mirror the texture, since we're looking from the inside out
            this._scene.add(this._mesh);

            this.animate();
        },

        // creates div and buttons for onscreen video controls
        createControls: function() {

            var muteControl = this.options.muted ? 'fa-volume-off' : 'fa-volume-up';
            var playPauseControl = this.options.autoplay ? 'fa-pause' : 'fa-play';

            var controlsHTML = ' \
                <div class="controls"> \
                    <a href="#" class="resetButton button fa"><img src="../img/repeat.png" style="cursor:pointer;"></a> \
                    <p class="button fa" id="device_lon">az: 0</p> \
                    <p class="button fa" id="device_lat">el: 0</p> \
                    <a href="#" class="fullscreenButton button fa fa-expand"></a> \
                </div> \
            ';

            $(this.element).append(controlsHTML, true);

            // hide controls if option is set
            if(this.options.hideControls) {
                $(this.element).find('.controls').hide();
            }

            // wire up controller events to dom elements
            this.attachControlEvents();
        },

        attachControlEvents: function() {

            // create a self var to pass to our controller functions
            var self = this;

            this.element.addEventListener( 'mousemove', this.onMouseMove.bind(this), false );
            //this.element.addEventListener( 'touchmove', this.onMouseMove.bind(this), false );
            this.element.addEventListener( 'mousewheel', this.onMouseWheel.bind(this), false );
            this.element.addEventListener( 'DOMMouseScroll', this.onMouseWheel.bind(this), false );
            this.element.addEventListener( 'mousedown', this.onMouseDown.bind(this), false);
            //this.element.addEventListener( 'touchstart', this.onMouseDown.bind(this), false);
            this.element.addEventListener( 'mouseup', this.onMouseUp.bind(this), false);
            //this.element.addEventListener( 'touchend', this.onMouseUp.bind(this), false);
            if (window.DeviceOrientationEvent) {
                console.log("Device orientation event found!");
                window.addEventListener( 'deviceorientation', this.onDeviceOrientation.bind(this), false);
                window.addEventListener("orientationchange", this.onOrientationChange.bind(this), false);
            } else {
                console.log("Device orientation NOT found!");
            }

            $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange',this.fullscreen.bind(this));

            $(window).resize(function() {
                self.resizeGL($(self.element).width(), $(self.element).height());
            });

            // Player Controls
            $(this.element).find('.playButton').click(function(e) {
                e.preventDefault();
                if($(this).hasClass('fa-pause')) {
                    $(this).removeClass('fa-pause').addClass('fa-play');
                    self.pause();
                } else {
                    $(this).removeClass('fa-play').addClass('fa-pause');
                    self.play();
                }
            });

            // Player Controls
            $(this.element).find('.resetButton').click(function(e) {
                e.preventDefault();
                self._resetDeviceOrientation();
            });

            $(this.element).find(".fullscreenButton").click(function(e) {
                e.preventDefault();
                var elem = $(self.element)[0];
                if($(this).hasClass('fa-expand')) {
                    if (elem.requestFullscreen) {
                      elem.requestFullscreen();
                    } else if (elem.msRequestFullscreen) {
                      elem.msRequestFullscreen();
                    } else if (elem.mozRequestFullScreen) {
                      elem.mozRequestFullScreen();
                    } else if (elem.webkitRequestFullscreen) {
                      elem.webkitRequestFullscreen();
                    }
                } else {
                    if (elem.requestFullscreen) {
                      document.exitFullscreen();
                    } else if (elem.msRequestFullscreen) {
                      document.msExitFullscreen();
                    } else if (elem.mozRequestFullScreen) {
                      document.mozCancelFullScreen();
                    } else if (elem.webkitRequestFullscreen) {
                      document.webkitExitFullscreen();
                    }
                }
            });

            $(this.element).find(".muteButton").click(function(e) {
                e.preventDefault();
                if($(this).hasClass('fa-volume-off')) {
                    $(this).removeClass('fa-volume-off').addClass('fa-volume-up');
                    self._video.muted = false;
                } else {
                    $(this).removeClass('fa-volume-up').addClass('fa-volume-off');
                    self._video.muted = true;
                }
            });

        },

        onMouseMove: function(event) {
            this._onPointerDownPointerX = event.clientX;
            this._onPointerDownPointerY = -event.clientY;

            this._onPointerDownLon = this._lon;
            this._onPointerDownLat = this._lat;

            var x, y;

            if(this.options.clickAndDrag) {
                if(this._mouseDown) {
                    x = event.pageX - this._dragStart.x;
                    y = event.pageY - this._dragStart.y;
                    this._dragStart.x = event.pageX;
                    this._dragStart.y = event.pageY;
                    this._lon += x;
                    this._lat -= y;
                    console.log("Longitude: " + this._lon, "Lattitude: " +this._lat);
                    $("#device_lon").html("az: " + this._lon);
                    $("#device_lat").html("el: " + this._lat);
                    if (this.callback !== undefined){
                        this.callback.call(this, this._lon, this._lat);
                    }
                }
            } else {
                x = event.pageX - $(this.element).find('canvas').offset().left;
                y = event.pageY - $(this.element).find('canvas').offset().top;
                this._lon = ( x / $(this.element).find('canvas').width() ) * 430 - 225;
                this._lat = ( y / $(this.element).find('canvas').height() ) * -180 + 90;
                this._lon -= this._lon_offset;
                this._lat -= this._lat_offset;
            }
        },

        onDeviceOrientation: function(event) {
            var angle = -1 * Math.round(event.alpha);
            this._lon = (angle - this._lon_offset) % 360;
            if ((this._orientationMode == 90) && (event.gamma < 0)){
                this._lon = (this._lon + 180) % 360;
                this._lat = Math.round((event.gamma + 90) * -1) % 90;
            } else if ((this._orientationMode == 90) && (event.gamma > 0)){
                this._lat = Math.round((event.gamma - 90) * -1) % 180;
            }
            else if ((this._orientationMode == 270) && (event.gamma > 0)){
                this._lon = (this._lon + 180) % 360;
                this._lat = Math.round((event.gamma - 90)) % 90;
            } else if ((this._orientationMode == 270) && (event.gamma < 0)){
                this._lat = Math.round((event.gamma + 90)) % 180;
            }
            else if ((this._orientationMode == 0) || (this._orientationMode == 180)) {
                this._lon = Math.round(this._lon - event.gamma);
                this._lat = Math.round(event.beta) - 90;
            }

            //console.log("Angle: " + angle, "Longitude: " + this._lon, "Lattitude: " +this._lat);
            $("#device_lon").html("az: " + this._lon);
            $("#device_lat").html("el: " + this._lat);
            if (this._firstCallFlag){
                this._resetDeviceOrientation();
                this._firstCallFlag = false;
            }
            // the following query should prevent too fast updates of the BRIR change while turning
            if ((this._last_lon - this._lon >= 5) || (this._last_lon - this._lon <= -5)){
                if (this.callback !== undefined){
                    this.callback.call(this, this._lon, this._lat);
                }
                this._last_lon = this._lon;
            }
        },

        onOrientationChange: function(){
            // Announce the new orientation number
            if ((screen.orientation)|| (window.orientation)){
                var orientation = screen.orientation || window.orientation;
                var angle = orientation.angle || orientation.angle;
                /*
                if ((angle === 0) || (angle === 180)){
                    this._orientationMode = "portrait";
                } else if ((angle === 90) || (angle === 270)) {
                       this._orientationMode = "landscape";
                }*/
                this._orientationMode = angle;
                console.log("Orientation changed to " + this._orientationMode);
            }
        },

        onMouseWheel: function(event) {

            var wheelSpeed = -0.01;

            // WebKit
            if ( event.wheelDeltaY ) {
                this._fov -= event.wheelDeltaY * wheelSpeed;
            // Opera / Explorer 9
            } else if ( event.wheelDelta ) {
                this._fov -= event.wheelDelta * wheelSpeed;
            // Firefox
            } else if ( event.detail ) {
                this._fov += event.detail * 1.0;
            }

            var fovMin = 3;
            var fovMax = 100;

            if(this._fov < fovMin) {
                this._fov = fovMin;
            } else if(this._fov > fovMax) {
                this._fov = fovMax;
            }

            this._camera.setLens(this._fov);
            event.preventDefault();
        },

        onMouseDown: function(event) {
            this._mouseDown = true;
            this._dragStart.x = event.pageX;
            this._dragStart.y = event.pageY;
        },

        onMouseUp: function() {
            this._mouseDown = false;
        },

        animate: function() {
            // set our animate function to fire next time a frame is ready
            requestAnimationFrame( this.animate.bind(this) );

            if( this._isVideo ) {
                if ( this._video.readyState === this._video.HAVE_ENOUGH_DATA) {
                    if(typeof(this._texture) !== "undefined" ) {
                        var ct = new Date().getTime();
                        if(ct - this._time >= 30) {
                            this._texture.needsUpdate = true;
                            this._time = ct;
                        }
                    }
                }
            }

            this.render();
        },

        render: function() {
            this._lat = Math.max( - 85, Math.min( 85, this._lat ) );
            this._phi = ( 90 - this._lat ) * Math.PI / 180;
            this._theta = (this._lon + 180) * Math.PI / 180;

            var cx = 500 * Math.sin( this._phi ) * Math.cos( this._theta);
            var cy = 500 * Math.cos( this._phi );
            var cz = 500 * Math.sin( this._phi ) * Math.sin( this._theta);

            this._camera.lookAt(new THREE.Vector3(cx, cy, cz));

            // distortion
            if(this.options.flatProjection) {
                this._camera.position.x = 0;
                this._camera.position.y = 0;
                this._camera.position.z = 0;
            } else {
                this._camera.position.x = - cx;
                this._camera.position.y = - cy;
                this._camera.position.z = - cz;
            }

            this._renderer.clear();
            this._renderer.render( this._scene, this._camera );
        },

        // Video specific functions, exposed to controller
        play: function() {
            //code to play media
            this._video.play();
        },

        pause: function() {
            //code to stop media
            this._video.pause();
        },

        loadVideo: function(videoFile) {
            this._video.src = videoFile;
        },

        loadPhoto: function(photoFile) {
            this._texture = THREE.ImageUtils.loadTexture( photoFile );
        },

        fullscreen: function() {
            if(!window.screenTop && !window.screenY && $(this.element).find('a.fa-expand').length > 0) {
                this.resizeGL(screen.width, screen.height);

                $(this.element).addClass('fullscreen');
                $(this.element).find('a.fa-expand').removeClass('fa-expand').addClass('fa-compress');

                this._isFullscreen = true;
            } else {
                this.resizeGL(this._originalWidth, this._originalHeight);

                $(this.element).removeClass('fullscreen');
                $(this.element).find('a.fa-compress').removeClass('fa-compress').addClass('fa-expand');

                this._isFullscreen = false;
            }
        },

        resizeGL: function(w, h) {
            this._renderer.setSize(w, h);
            this._camera.aspect = w / h;
            this._camera.updateProjectionMatrix();
        },

        _resetDeviceOrientation: function(){
            console.log("Resetting Device Orientation!");
            this._lon_offset += this._lon % 360;
            this._lat_offset += this._lat % 90;
            this._lon = 0;
            this._lat = 0;
            $("#device_lon").html("az: " + this._lon);
            $("#device_lat").html("el: " + this._lat);

        }

    };

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function ( options, callback ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName,
                new Plugin( this, options, callback ));
            }
        });
    };

})( jQuery, THREE, Detector, window, document );
