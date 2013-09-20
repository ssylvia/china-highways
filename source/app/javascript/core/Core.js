define(["storymaps/utils/Helper","storymaps/core/Data","dojo/has","dojo/on","esri/map","lib/all/jquery/jquery-1.10.2.min.js","lib/all/jquery.mousewheel.js"],
	function(Helper,Highways,Has,On,Map){

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
					updateMap();_swipePane.resizeFix();
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

						$("#scroll-indicator").slideUp("fast");
						
						if (delta < 0 && slideHeight + scrollTop === scrollHeight){
							if(_scrollDelayed){
								_swipePane.swipeNext();
							}
							else{
								if(_dataIndex < Highways.data.length - 1){
									$("#scroll-indicator").slideDown("fast");
								}
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
				center: [Highways.data[_dataIndex].long,Highways.data[_dataIndex].lat],
				zoom: Highways.data[_dataIndex].zoom,
				maxZoom: 17
			});

			_map.on("load",function(){
				_map.disableScrollWheelZoom();
				_map.disableKeyboardNavigation();
			});
		}

		function appendNewSlide(index)
		{
			var newSlide = _swipePane.createSlide('\
				<h1 class="item-title">'+ unescape(Highways.data[index].title) +'</h1>\
				<p class="item-description">'+ unescape(Highways.data[index].description) +'</p>\
			');

			newSlide.append();
		}

		function updateMap()
		{
			if (_dataIndex > 0 && _map.getBasemap() !== "satellite"){
				_map.setBasemap("satellite");
			}
			else if(_dataIndex === 0){
				_map.setBasemap("streets");
			}

			_map.centerAndZoom([Highways.data[_dataIndex].long,Highways.data[_dataIndex].lat],Highways.data[_dataIndex].zoom);
		}

		return {
			init: init
		};
});