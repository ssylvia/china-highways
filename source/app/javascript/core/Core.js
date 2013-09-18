define(["storymaps/utils/Helper","storymaps/core/Data","dojo/on","esri/map"],
	function(Helper,Highways,On,Map){

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
				mode: 'vertical',
				loop: false,
				keyboardControl: true,
				onSlideChangeEnd: function(swiper){
					_dataIndex = swiper.activeIndex;
					updateMap();
				}
			});

			_swipePane = swipePane;

			for (var i=0; i < Highways.data.length; i++){
				appendNewSlide(i);
			}

			$("body").mousewheel(function(event, delta, deltaX, deltaY){

				if (_swipeOnWheelReady){
				
					var slide = $(".swiper-slide.swiper-slide-active");
					var slideHeight = slide.outerHeight();
					var scrollTop = slide.scrollTop();
					var scrollHeight = slide.prop('scrollHeight');
					
					if (deltaY < 0 && slideHeight + scrollTop === scrollHeight){
						if(_scrollDelayed){
							_swipePane.swipeNext();
						}
						_scrollDelayed = true;
						delayScroll();
					}
					else if(deltaY > 0 && scrollTop === 0){
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
						slide.scrollTop(scrollTop - event.originalEvent.wheelDeltaY);
					}

				}

			});
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
				basemap: "satellite",
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
				<h1 class="item-title">'+ Highways.data[index].title +'</h1>\
				<p class="item-description">'+ Highways.data[index].description +'</p>\
			');

			newSlide.append();
		}

		function updateMap()
		{
			_map.centerAndZoom([Highways.data[_dataIndex].long,Highways.data[_dataIndex].lat],Highways.data[_dataIndex].zoom);
		}

		return {
			init: init
		};
});