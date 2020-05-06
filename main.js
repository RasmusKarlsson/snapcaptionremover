require( [
], function ( ){
 	//'use strict';

    var snapImage = {};

    var imageLoader = document.getElementById('imageLoader');
    imageLoader.addEventListener('change', handleImage, false);
    var canvas = document.getElementById('imageCanvas');
    var ctx = canvas.getContext('2d');

    function calculateCaptionHeight(context,width,height)
    {
        var imageData = context.getImageData(0, 0, width, height);
        console.log(imageData);
        var currentLine = 1;
        var targetTopLine = 1;
        var targetBottomLine = 1;
        var topLine = 0;
        var bottomLine = 0;
        var topLineDiff = 99999999;
        var bottomLineDiff = 99999999;
        var rowDifference = new Array(width);
        var pixel = [];
        var pixelOver = [];
        for (var i = 1; i < height; i+=1) 
        {
            linediff = 0;
            rowDifference = [];
            topLine = 0.0;
            bottomLine = 0.0;
            for (var j = 0; j < width; j+=1) 
            {
                pixel[0] = (1.0/255.0)*imageData.data[4*(i*width+j)+0];
                pixel[1] = (1.0/255.0)*imageData.data[4*(i*width+j)+1];
                pixel[2] = (1.0/255.0)*imageData.data[4*(i*width+j)+2];

                pixelOver[0] = (1.0/255.0)*imageData.data[4*((i-1)*width+j)+0];
                pixelOver[1] = (1.0/255.0)*imageData.data[4*((i-1)*width+j)+1];
                pixelOver[2] = (1.0/255.0)*imageData.data[4*((i-1)*width+j)+2];
               /// if(i == 681) debugger;
                //rowDifference[j] = Math.abs(pixelOver[0]*0.6 - pixel[0]);
               // linediff += rowDifference[j];
               /*if( i > 3) console.log(Math.abs(pixelOver[0]*0.6 - pixel[0]));*/
               //if(Math.abs(pixelOver[1]*0.4 - pixel[1]) > 0.1)
               topLine += Math.abs(pixelOver[1]*0.4 - pixel[1]);
               bottomLine += Math.abs(pixel[1]*0.4 - pixelOver[1]);

            }

            if(topLine < topLineDiff)
            {
                //console.log(topLine);
                topLineDiff = topLine;
                targetTopLine = i;
            }

            if(bottomLine < bottomLineDiff)
            {
                //console.log(bottomLine);
                bottomLineDiff = bottomLine;
                targetBottomLine = i;
            }
        }
        //Fix caption brightness
        console.log(imageData.width,width);

        var f = 102.0/255.0;
/*
        for (var i = targetTopLine; i < targetBottomLine; i+=1) 
        {
            for (var j = 0; j < width*4; j+=1) 
            {
                var floatPixel = [];
                floatPixel[0] = (imageData.data[4*i*width+j+0])/255.0;
                floatPixel[1] = (imageData.data[4*i*width+j+1])/255.0;
                floatPixel[2] = (imageData.data[4*i*width+j+2])/255.0;
                var multiPlier = [];
                multiPlier[0] = floatPixel[0] * f;
                multiPlier[1] = floatPixel[1] * f;
                multiPlier[2] = floatPixel[2] * f;
                imageData.data[4*i*width+j+0] = Math.abs(255.0* floatPixel[0]);
                imageData.data[4*i*width+j+1] = Math.abs(155.0* floatPixel[1]);
                imageData.data[4*i*width+j+2] = Math.abs(255.0* floatPixel[2]);

            }

        }*/

        var captionHeight = (targetBottomLine-targetTopLine);

        var mask_u8 = new Uint8Array(width * height);

        for (var i = (targetTopLine+10)*width; i < (targetBottomLine-10)*width; i+=1) 
        {
            var Y = .299 * imageData.data[4 * i] + .587 * imageData.data[4 * i + 1] +  .114 * imageData.data[4 * i + 2];
            if(Y > 103)
            {
                var rad = 2;
               // imageData.data[4 * i + 1]=0;
                for(var dx = -rad; dx <= rad; dx++){
                    for(var dy = -rad; dy <= rad; dy++){
                        if(dx * dx + dy * dy <= rad * rad){
                            mask_u8[i + dx + dy * width] = 1;
                        }
                    }
                }
            }
        }
        rad = 1;
        for(var x = 0; x < width;x++)
        {
            for(var dx = -rad; dx <= rad; dx++)
            {
                for(var dy = -rad; dy <= rad; dy++)
                {
                    if(dx * dx + dy * dy <= rad * rad)
                    {
                        mask_u8[targetTopLine*width + dx + x +dy * width] = 1;
                    }
                }
            }

            for(var dx = -rad; dx <= rad; dx++){
                for(var dy = -rad; dy <= rad; dy++){
                    if(dx * dx + dy * dy <= rad * rad){
                        mask_u8[targetBottomLine*width + dx +x + dy * width] = 1;
                    }
                }
            }
        }

        for (var i = targetTopLine*4*width; i < targetBottomLine*4*width; i+=4) 
        {
                var floatPixel = [];
                floatPixel[0] = (imageData.data[i+0])/255.0;
                floatPixel[1] = (imageData.data[i+1])/255.0;
                floatPixel[2] = (imageData.data[i+2])/255.0;
                
                imageData.data[i+0] = Math.abs(255.0* floatPixel[0]/f);
                imageData.data[i+1] = Math.abs(255.0* floatPixel[1]/f);
                imageData.data[i+2] = Math.abs(255.0* floatPixel[2]/f);

        }

        

        for(var channel = 0; channel < 3; channel++){
            var img_u8 = new Uint8Array(width * height)
            for(var n = 0; n < imageData.data.length; n+=4){
                img_u8[n / 4] = imageData.data[n + channel]
            }
            InpaintTelea(width, height, img_u8, mask_u8)
            for(var i = 0; i < img_u8.length; i++){
                imageData.data[4 * i + channel] = img_u8[i]
            }   
        }

        for(var i = 0; i < img_u8.length; i++){
            imageData.data[4 * i + 3] = 255;
        }        

        ctx.putImageData(imageData,0,0);

        

       /* console.log("top",targetTopLine);
        console.log("bottom",targetBottomLine);
        console.log("top-bottom",targetBottomLine-targetTopLine);*/
    }

    function handleImage(e){
        var reader = new FileReader();
        reader.onload = function(event){
            var img = new Image();
            img.onload = function(){
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img,0,0);
                calculateCaptionHeight(ctx,canvas.width,canvas.height);
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(e.target.files[0]);     
    }

     //writeStuff();

});