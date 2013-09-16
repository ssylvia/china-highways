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

		function init()
		{
			Helper.enableRegionLayout();
			loadMap();
		}

		function loadMap()
		{
			var map = new Map("map",{
				basemap: "satellite",
				center: [Highways.data[0].long,Highways.data[0].lat],
				zoom: Highways.data[0].zoom
			});

			On(map,"load",function(){
				map.disableScrollWheelZoom();
			});

			On.once(map,"update-end",function(){
				appReady();
			});
		}

		function appReady()
		{
		}

		return {
			init: init
		};
});