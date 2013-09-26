define(["storymaps/utils/Helper",
	"storymaps/core/Data",
	"dojo/has","dojo/on",
	"dojo/sniff",
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
		Has,
		On,
		Sniff,
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
		var _locations;
		var _dataIndex = 0;
		var _scrollDelayed = false;
		var _swipeOnWheelReady = true;

		function init()
		{
			Helper.enableRegionLayout();
			loadSwiper();
			loadMap();
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
					_swipePane.resizeFix();
				}
			});

			_swipePane = swipePane;
			window.test = _swipePane;

			for (var i=0; i < Highways.data.length; i++){
				appendNewSlide(i);
			}

			if(!Has("touch")){
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
			}
			else{
				$("body").addClass("touch");
				$("#story-pane").height($(".swiper-slide-active .item-title").outerHeight() + 30);
				_swipePane.resizeFix();

				$(".swiper-slide").click(function(){
					if ($("#story-pane").hasClass("expanded")){
						$("#story-pane").removeClass("expanded").height($(".swiper-slide-active .item-title").outerHeight() + 30);
					}
					else{
						$("#story-pane").addClass("expanded").css("height", "100%");
					}
					_swipePane.resizeFix();
				});
			}

			if(Has("ie") < 9){
				$(".backdrop").fadeTo(0,"0.8");
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

			window.map = _map;

			_locations.on("click",function(e){
				var index = $.inArray(e.graphic,_locations.graphics) + 1;
				_swipePane.swipeTo(index);
			});

			_locations.on("mouse-over",function(e){
				_map.setCursor("pointer");
			});

			_locations.on("mouse-out",function(e){
				_map.setCursor("default");
			});

			_map.on("load",function(){
				_map.disableScrollWheelZoom();
				_map.disableKeyboardNavigation();
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

			return string;
		}

		function updateMap()
		{
			if (_dataIndex > 0 && _map.getBasemap() !== "satellite"){
				_map.setBasemap("satellite");
				_locations.hide();
			}
			else if(_dataIndex === 0){
				_map.setBasemap("streets");
				_locations.show();
			}

			_map.centerAndZoom(getOffsetCenter(),Highways.data[_dataIndex].zoom);
		}

		function getOffsetCenter()
		{
			var res = 9783.93962049996;
			var leftPos = 0;
			var topPos = 0;

			if(Has("touch")){
				topPos = ($("#content").height() - $("#story-pane").position().top)/2;
			}
			else{
				leftPos = ($("#content").width() - $("#story-pane").position().left)/2;
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

		return {
			init: init
		};
});