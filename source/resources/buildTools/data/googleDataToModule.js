var title = "China Highways";

var data = require("./tempData.json");
var dataObj = data[title];

var newDataStr = "["

for (i = 0; i < dataObj.length; i++){
	var obj = dataObj[i];
	var temp = "{"; 
	if (i !== 0){
		newDataStr = newDataStr + ",";
	}
	for (j in obj){
		if (j !== "rowNumber"){
			if (isNaN(obj[j])){
				temp = temp + j + ": '" + obj[j] + "',";
			}
			else{
				temp = temp + j + ": " + obj[j] + ",";
			}	
		}
	}
	temp = temp.substring(0,temp.length - 1);
	newDataStr = newDataStr + temp + "}";
}

newDataStr = newDataStr + "]";

var outputStr = "define([],\
	function(){\
		var appData = " + newDataStr + ";\
		return {\
			data: appData\
		};\
	});"

var fs = require('fs');
fs.writeFile("source/app/javascript/core/Data.js", outputStr, function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("The file was saved!");
    }
}); 