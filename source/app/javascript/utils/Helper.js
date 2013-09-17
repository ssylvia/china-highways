define(["storymaps/utils/SocialSharing"], 
	function(){
	/**
	* Helper
	* @class Helper
	* 
	* Collection of helper functions
	*
	* Dependencies: Jquery 1.10.2
	*/

	function regionLayout()
	{
		$(".region-center").each(function(){
			var l = $(this).siblings(".region-left:visible").outerWidth(),
				r = $(this).siblings(".region-right:visible").outerWidth(),
				t = $(this).siblings(".region-top:visible").outerHeight(),
				b = $(this).siblings(".region-bottom:visible").outerHeight(),
				x = l + r,
				y = t + b;
			$(this).css({
				"top": t,
				"left": l,
				"height" : $(this).parent().outerHeight() - y,
				"width" : $(this).parent().outerWidth() - x
			});
		});
	}

	return {

		enableRegionLayout: function()
		{
			regionLayout();
			$(window).resize(function(){
				regionLayout();
			});
		},

		syncMaps: function(maps,currentMap,extent)
		{
			dojo.forEach(maps,function(map){
				if (map !== currentMap){
					map.setExtent(extent);
				}
			});
		}
	};
});