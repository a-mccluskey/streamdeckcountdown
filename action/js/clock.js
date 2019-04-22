/**
 * Simple Clock with adjustable colors (heavily inspired by kirupa: https://www.kirupa.com/html5/create_an_analog_clock_using_the_canvas.htm)
 * @param {canvas} cnv an existing canvas element in the DOM
 * API:
 * - drawClock() -> draws the clock - would normally called every second
 * - getImageData() -> returns base64-encode string of the canvas
 * - setColors(jsonObj) -> set colors of the clock's components as JSON
 * 		{
 *			hour:	"#efefef",
 *			minute: "#cccccc",
 *			second: "#ff9933",
 *			stroke: "#cccccc",
 *			background: "#000000"
 *		}
 * - getColors() -> get current color values
 */

function Clock(cnv)
{
	if (!cnv) return;
	var ctx = cnv.getContext('2d');
	var clockRadius = cnv.width/2;
	var clockX = cnv.width / 2;
	var clockY = cnv.height / 2;
	var twoPi = 2 * Math.PI;
	var colors = {};
	var arcColour = "#FFF";
	var max_ms = 300000, cur_ms = 300000;
	
	
	//const max_ms = 300000;
	//var cur_ms = max_ms;
	
	resetColors();

	function resetColors() {
		setColors({
			hour:	"#efefef",
			minute: "#cccccc",
			second: "#ff9933",
			stroke: "#cccccc",
			background: "#000000"
		});
	}

	function drawArm(progress, armThickness, armLength, armColor)
	{
		var armRadians = (twoPi * progress) - (twoPi/4);
		var targetX = clockX + Math.cos(armRadians) * (armLength * clockRadius);
		var targetY = clockY + Math.sin(armRadians) * (armLength * clockRadius);

		ctx.lineWidth = armThickness;
		ctx.strokeStyle = armColor;

		ctx.beginPath();
		ctx.moveTo(clockX, clockY); // Start at the center
		ctx.lineTo(targetX, targetY); // Draw a line outwards
		ctx.stroke();
	}
	
	
	function draw_arrow() {
	
	
	var ang= 310-((cur_ms/max_ms)*260);
	//calculate the angle that the arrow needs to point in
	
	var centX = cnv.height/2;
	var centY = cnv.width/2;
	
	if(cur_ms<=(max_ms/10)) { ctx.strokeStyle="#F00"; } else { ctx.strokeStyle="#0F0"; }
	
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.moveTo(centX, centY);
	//start the line at the centre of the circle
	var xcoord = centX+((centX-20)*Math.sin(ang*Math.PI/180));
	var ycoord = centY+((centY-20)*Math.cos(ang*Math.PI/180));
	//this bit is a bit of trigonomatry to calculate the coordinates

    ctx.lineTo(xcoord,ycoord);
	//the end point of the line
	ctx.closePath();
    ctx.stroke();
	//draw the line
	if(cur_ms>=1000) {	cur_ms = cur_ms -1000; }
	
	
}//draw_arrow()
		
	
	function drawClock() 
	{
		
	ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, cnv.width, cnv.height);
	var centreY = cnv.width / 2;
	var centreX = cnv.height / 2;
	//the html page has already set the size of the canvas, we need to work on
	
	if(centreX > centreY) {
		var radius = centreY-10;//the minus ten is so that the the edge can be seen all the way round the curve
	} else {
		var radius = centreX-10;
	}// the radius needs to be the smallest of the two
	
	//the next couple of lines are the angles that the dial draw from and to - 0 is east, 180 to west, 270 to north and 90 to south
	var lstart = 140 //so south east
	var lend = 40; //so south west
	
	var lineStartRad = (lstart*Math.PI)/180; 
	var lineFinishRad = (lend*Math.PI)/180;
	//the next function requres the angles in RADIANS not DEGREES, so convert them.
	
	ctx.lineWidth = 3;//by default will draw a 1px line, which isnt very user friendly.
	ctx.beginPath();
	ctx.arc(centreX, centreY, radius, lineStartRad, lineFinishRad, false);
	//canvmethods.closePath();
	ctx.strokeStyle = arcColour;

	
	/* arc() expects radians as the angles, yes proper mathmatians would see this as heresy :-D but degrees are an 
	easier(for me) thing to work with. Yes I'm sure that I could make the conversion in its own function, 
	but its not really needed as its only done twice and all here. 
	The true is so it can be drawn counter clockwise, so it draws from south east to south west.
	*/
	
	ctx.stroke(); //displays the arc
	draw_arrow(); //finally put the arrows on the clock
	
	}//drawclock()

	function setColors(jsnColors) 
	{
		(typeof jsnColors === 'object') && Object.keys(jsnColors).map(c => colors[c] = jsnColors[c]);
	}

	function getColors() 
	{
		return this.colors;
	}

	function getImageData() 
	{
		return cnv.toDataURL();
	}
	
	function resetCountdown()
	{
		cur_ms=max_ms;
	}
	function setType(jsnType)
	{
		(typeof jsnType === 'object') && Object.keys(jsnType).map(arcColour = jsnType);
		arcColour=jsnType;
	}
	function setTimer(jsnTime)
	{
		(typeof jsnTime === 'object') && Object.keys(jsnTime).map(max_ms = jsnTime);
		cur_ms = max_ms;
		max_ms=jsnTime;
	}
	function getRemTime()
	{
		return cur_ms;
	}
	function setRemTime(remTime)
	{
		cur_ms = remTime;
	}

	return {
		drawClock: drawClock,
		getImageData: getImageData,
		setColors: setColors,
		getColors: getColors,
		setType: setType,
		setTimer: setTimer,
		colors: colors,
		resetCountdown: resetCountdown,
		resetColors: resetColors,
		getRemTime: getRemTime,
		setRemTime: setRemTime
	}
}
