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
				if (deltaY < 0){
					_swipePane.swipeNext();
				}
				else if(deltaY > 0){
					_swipePane.swipePrev();
				}
			});
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