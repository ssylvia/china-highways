define(["storymaps/utils/Helper","dojo/on","esri/map","esri/arcgis/utils"],
	function(Helper,On,Map){

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
				center: [-122.45,37.75],
				zoom: 13
			});

			On.once(map,"update-end",function(){
				appReady();
			});
		}

		function appReady()
		{
			Helper.removeLoadScreen();
		}

		return {
			init: init
		};
});