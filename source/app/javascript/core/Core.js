define(["storymaps/utils/Helper",
	"storymaps/core/Data",
	"dojo/query",
	"dojo/has",
	"dojo/on",
	"dojox/gesture/tap",
	"dojo/sniff",
	"dojo/dnd/move",
	"esri/map",
	"esri/layers/GraphicsLayer",
	"esri/graphic",
	"esri/geometry/Point",
	"esri/symbols/PictureMarkerSymbol",
	"esri/geometry/webMercatorUtils",
	"lib/all/jquery/jquery-1.10.2.min.js",
	"lib/all/jquery.mousewheel.js"],
	function(Helper,
		Highways,
		Query,
		Has,
		On,
		Tap,
		Sniff,
		Move,
		Map,
		GraphicsLayer,
		Graphic,
		Point,
		PictureMarkerSymbol,
		GeoUtils
		){

		/**
		* Core
		* @class Core
		*
		* Main class for story map application
		*
		* Dependencies: Jquery 1.10.2
		*/

		var _swipePane;
		var _map;
		var _locator;
		var _locatorGraphics;
		var _locations;
		var _dataIndex = 0;
		var _scrollDelayed = true;
		var _swipeOnWheelReady = true;
		var _mobileTopOffset;

		function init()
		{
			Helper.enableRegionLayout();
			loadSwiper();
			loadMap();

			toggleLocator();
		}
		function loadSwiper()
		{
			var swipePane = new Swiper('.swiper-container',{
				mode: getSwipeMode(),
				loop: false,
				keyboardControl: true,
				onSlideChangeEnd: function(swiper){
					_dataIndex = swiper.activeIndex;
					updateMap();
					updateProgressBar();
					_swipePane.resizeFix();
				}
			});

			_swipePane = swipePane;

			var progressHandle = new Move.constrainedMoveable(dojo.byId("progress-handle"),{
				constraints: function(){
					var bb = {
						t: 0,
						l: 0,
						h: $("#progress-wrapper").height(),
						w: 0
					}
					return bb;
				}
			});
			progressHandle.onMove = function(e,topLeft){
				updateProgressBar(topLeft.t);
			}
			progressHandle.onMoveStop = function(){
				var delta = ($("#progress-wrapper").height()/(Highways.data.length - 1));
				var pos = Math.round($("#progress-handle").position().top/delta);
				var newPos = pos*delta
				$("#progress-bar").height(newPos);
				$("#progress-handle").css("top",newPos);
			}

			for (var i=0; i < Highways.data.length; i++){
				appendNewSlide(i);
			}

			if(Has("touch")){
				$("body").addClass("touch");
				$("#story-pane").removeClass("region-center").css({
					"height": "100%",
					"width": "100%"
				});
				Helper.resetRegionLayout();
				$("#story-wrapper").height($(".swiper-slide-active .item-title").outerHeight() + $(".swiper-slide-active .text-inicator").outerHeight() + 30);
				_swipePane.resizeFix();

				_mobileTopOffset = ($("#content").height() - $("#story-wrapper").position().top)/2;

				$(".swiper-slide").click(function(){
					if ($("body").hasClass("expanded")){
						$("body").removeClass("expanded")
						$("#story-wrapper").height($(".swiper-slide-active .item-title").outerHeight() + $(".swiper-slide-active .text-inicator").outerHeight() + 30);
					}
					else{
						$("body").addClass("expanded")
						$("#story-wrapper").css("height", "100%");
					}
					_swipePane.resizeFix();
				});

				On(dojo.byId("mobile-locator-toggle"),Tap,function(){
					if($("#mobile-locator-toggle").hasClass("hidden")){
						$(this).removeClass("hidden");
						$("#locator-wrapper").removeClass("hidden");
						$("#mobile-locator-toggle .icon-map-pin").addClass("icon-close").removeClass("icon-map-pin");
					}
					else{
						$(this).addClass("hidden");
						$("#locator-wrapper").addClass("hidden");
						$("#mobile-locator-toggle .icon-close").addClass("icon-map-pin").removeClass("icon-close");
					}
				});
			}
			else{
				$("body").addClass("desktop");
				$("body").mousewheel(function(event, delta){

					if (_swipeOnWheelReady){
					
						var slide = $(".swiper-slide.swiper-slide-active");
						var slideHeight = slide.outerHeight();
						var scrollTop = slide.scrollTop();
						var scrollHeight = slide.prop('scrollHeight');
						
						if (delta < 0 && slideHeight + scrollTop === scrollHeight){
							if(_scrollDelayed){
								_swipePane.swipeNext();
							}
							_scrollDelayed = true;
							delayScroll();
						}
						else if(delta > 0 && scrollTop === 0){
							if(_scrollDelayed){
								_swipePane.swipePrev();
							}
							else{
								delayScroll();
							}
							_scrollDelayed = true;
						}
						else{
							_scrollDelayed = false;
							slide.scrollTop(scrollTop - (30 * delta));
						}

					}

				});

				$(".scroll-down").click(function(){
					_swipePane.swipeNext();
				});
				$(".scroll-up").click(function(){
					_swipePane.swipePrev();
				});

				$("#progress-container").click(function(e){
					var pos = e.clientY - $(this).position().top;
					updateProgressBar(pos,true);
				});
			}

			if(Has("ie") < 9){
				$(".backdrop").fadeTo(0,"0.8");
				$("#progress-bar").css("background-color","#777");
				$("#progress-point").css("background-color","#777");
			}
		}

		function getSwipeMode()
		{
			if (Has("touch")){
				return 'horizontal';
			}
			else{
				return 'vertical';
			}
		}

		function delayScroll()
		{
			var scrollDelay = 500;
			_swipeOnWheelReady = false;
			setTimeout(function(){
				_swipeOnWheelReady = true;
			},scrollDelay);
		}

		function loadMap()
		{
			_map = new Map("map",{
				basemap: "streets",
				center: [getOffsetCenter().getLongitude(),getOffsetCenter().getLatitude()],
				zoom: Highways.data[_dataIndex].zoom,
				maxZoom: 17,
				smartNavigation: false
			});

			_locations = new GraphicsLayer();
			_map.addLayer(_locations);

			dojo.forEach(Highways.data,function(ftr,i){
				if (i > 0){
					var pt = new Point(ftr.long,ftr.lat);
					var sym = new PictureMarkerSymbol('resources/images/redPin.png', 30, 30).setOffset(0,12);
					var attr = ftr;

					var graphic = new Graphic(pt,sym,attr);
					_locations.add(graphic);
				}
			});

			_locations.on("click",function(e){
				var index = $.inArray(e.graphic,_locations.graphics) + 1;
				_swipePane.swipeTo(index);
			});

			if (!Has("touch")){
				_locations.on("mouse-over",function(e){
					_map.setCursor("pointer");
				});

				_locations.on("mouse-out",function(e){
					_map.setCursor("default");
				});
			}

			_map.on("load",function(){
				_map.disableScrollWheelZoom();
				_map.disableKeyboardNavigation();
			});
		}

		function loadLocator()
		{
			_locator = new Map("locator-map",{
				basemap: "streets",
				center: [Highways.data[_dataIndex].long,Highways.data[_dataIndex].lat],
				slider: false,
				zoom: 4,
				logo: false,
				showAttribution: false,
				smartNavigation: false
			});

			_locatorGraphics = new GraphicsLayer();
			_locator.addLayer(_locatorGraphics);

			var pt = new Point(Highways.data[_dataIndex].long,Highways.data[_dataIndex].lat);
			var sym = new PictureMarkerSymbol('resources/images/redPin.png', 30, 30).setOffset(0,12);
			var attr = Highways.data[_dataIndex];

			var graphic = new Graphic(pt,sym,attr);
			_locatorGraphics.add(graphic);

			_locator.on("load",function(){
				_locator.disableMapNavigation();
			});
		}

		function appendNewSlide(index)
		{
			var newSlide = _swipePane.createSlide(getSlideContent(index));

			newSlide.append();
		}

		function getSlideContent(index)
		{
			var string = '\
				<h1 class="item-title">'+ unescape(Highways.data[index].title) +'</h1>\
				<p class="item-description">'+ unescape(Highways.data[index].description) +'</p>\
			';

			if(Has("touch")){
				var strAppend = '\
				<p class="text-inicator"><span class="fontello-info-circled" style="margin-left: 0;"></span>Tap for details <span class="fontello-left-narrow"></span><span class="fontello-right-narrow" style="margin-left: -.7em;"></span>Swipe to explore</p>\
				<h6 class="mobile-details-close">Tap to Close</h6>';
				string = string + strAppend;
			}
			else{
				if(index === 0){
					var strAppend = '<h6 id="intro-indicator" class="scroll-down">Scroll <span class="fontello-down-narrow"></span></h6>';
					string = string + strAppend;
				}
				else if (index === Highways.data.length - 1){
					var strPrepend = '<h6 class="scroll-up"><span class="fontello-up-narrow"></span></h6>';
					string = strPrepend + string;
				}
				else {
					var strPrepend = '<h6 class="scroll-up"><span class="fontello-up-narrow"></span></h6>';
					var strAppend = '<h6 class="scroll-down"><span class="fontello-down-narrow"></span></h6>';
					string = strPrepend + string + strAppend;
				}
			}

			return string;
		}
		
		function updateProgressBar(pos,fromClick)
		{
			if(Has("touch")){

			}
			else{
				var height = pos || (($("#progress-wrapper").height()/(Highways.data.length - 1))*_dataIndex);
				if(height >= 0 && height <= $("#progress-wrapper").height()){
					if(!fromClick){
						$("#progress-bar").height(height);
						$("#progress-handle").css("top",height);
					}
					if(pos){
						var delta = ($("#progress-wrapper").height()/(Highways.data.length - 1));
						var index = Math.round(pos/delta);
						if(_swipePane.activeIndex !== index){
							_swipePane.swipeTo(index);
						}
					}
				}
			}
		}

		function updateMap()
		{
			if (_dataIndex > 0){
				if(!_locator){
					loadLocator();
				}
				else{
					var pt = new Point(Highways.data[_dataIndex].long,Highways.data[_dataIndex].lat);
					_locator.centerAt(pt);
					_locatorGraphics.graphics[0].setGeometry(pt);
				}
				if (_map.getBasemap() !== "satellite"){
					_map.setBasemap("satellite");
					_locations.hide();
				}
				$("#mobile-locator-toggle").removeClass("disabled");
				$("#locator-wrapper").removeClass("disabled");
			}
			else if(_dataIndex === 0){
				_map.setBasemap("streets");
				_locations.show();
				$("#mobile-locator-toggle").addClass("disabled");
				$("#locator-wrapper").addClass("disabled");
			}

			_map.centerAndZoom(getOffsetCenter(),Highways.data[_dataIndex].zoom);
		}

		function getOffsetCenter()
		{
			var res = 9783.93962049996;
			var leftPos = 0;
			var topPos = 0;

			if(Has("touch")){
				topPos = _mobileTopOffset;
			}
			else{
				leftPos = ($("#content").width() - $("#story-wrapper").position().left)/2;
			}
			if(_map){
				res = $.grep(_map.__tileInfo.lods,function(a){
					return a.level === Highways.data[_dataIndex].zoom
				})[0].resolution;
			}
			var offsetX = leftPos * res;
			var offsetY = -topPos * res;
			var pt = new Point([Highways.data[_dataIndex].long,Highways.data[_dataIndex].lat]);
			pt = GeoUtils.geographicToWebMercator(pt);
			pt = pt.offset(offsetX,offsetY);

			return pt;
		}

		function toggleLocator()
		{
			if(Has("touch")){
				// TODO: touch toggle
			}
			else{
				$("#locator-wrapper").click(function(){
					if($(this).hasClass("hidden")){
						$(this).removeClass("hidden");
					}
					else{
						$(this).addClass("hidden");
					}
				});
			}
		}

		return {
			init: init
		};
});