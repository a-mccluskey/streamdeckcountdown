/* global $SD */
$SD.on('connected', conn => connected(conn));

function connected (jsn) {
    debugLog('Connected Plugin:', jsn);

    /** subscribe to the willAppear event */
    $SD.on('com.adm.cdwn.action.willAppear', jsonObj =>
        action.onWillAppear(jsonObj)
    );
    $SD.on('com.adm.cdwn.action.willDisappear', jsonObj =>
        action.onWillDisappear(jsonObj)
    );
    $SD.on('com.adm.cdwn.action.keyUp', jsonObj =>
        action.onKeyUp(jsonObj)
    );
    $SD.on('com.adm.cdwn.action.sendToPlugin', jsonObj =>
        action.onSendToPlugin(jsonObj)
    );
}

var action = {
    type: 'com.adm.cdwn.action',
    cache: {},
	

    getContextFromCache: function (ctx) {
        return this.cache[ctx];
    },

    onWillAppear: function (jsn) {

        if (!jsn.payload || !jsn.payload.hasOwnProperty('settings')) return;

        const clockIndex = jsn.payload.settings['clock_index'] || 0;
		var timerTypeIdx = jsn.payload.settings['timer_index'] || 0;
		//console.log("payload is: ", jsn.payload);
		var curRemTime =  jsn.payload.settings['rem_time'] || 0;
        const clock = new AnalogClock(jsn);

        clock.setClockFaceNum(clockIndex);
		clock.setClockTypeNum(timerTypeIdx);
		//get the existing backgroundColor & timer countdown
		//note that at this point the timer will be set to the max that it can be for the type.
		
		if(curRemTime>=1000) { clock.setRemTime(curRemTime); }
		else { curRemTime=clock.getRemTime(); }
		//give an initialised timer, ie. if the countdown is at zero
		//then we need to reset it, if its say 2 minutes, then its prob a reloaded plugin
		
        clock.toggleClock();
		//this bit displays the clock

        this.cache[jsn.context] = clock;
		// cache the current clock

        $SD.api.setSettings(jsn.context, {
            context: jsn.context,
            clock_index: clockIndex,
			timer_index: timerTypeIdx,
			rem_time: curRemTime
        });//saves all the settings to initalise them

        $SD.api.sendToPropertyInspector(
            jsn.context,
            { clock_index: clockIndex,
			timerIndex: timerTypeIdx },
            this.type
        );//the clock bk colour needs to be saved in the property inspector
    },

    onWillDisappear: function (jsn) {
		//called everytime the plugin is hidden, such as when the folder is changed
        let found = this.getContextFromCache(jsn.context);
        if (found) {
            // remove the clock from the cache
			found.destroyClock();
            delete this.cache[jsn.context];
        }
		//originally I tried to do a set settings so that the remaining time would be saved, 
		//but the SDK doesnt seem to save this setting properly - bug maybe?
    },

    onKeyUp: function (jsn) {
        const clock = this.getContextFromCache(jsn.context);
        /** Edge case +++ */
        if (!clock) this.onWillAppear(jsn);
        else clock.resetCountdown();
    },

    onSendToPlugin: function (jsn) {
        //console.log('--- OnSendToPlugin ---', jsn, jsn.payload);
        if (!jsn.payload) return;
		//if theres no changes then its not worth doing any more.
        let clockIndex = 0;
		let timerIDX = 0;
		//initialise these values to zero - these will be changed later
        const clock = this.getContextFromCache(jsn.context);
		//load the clock into a useable space

        if (jsn.payload.hasOwnProperty('DATAREQUEST')) {
			//if the PI is loaded do this
            if (clock && clock.isDemo()) {
                const arrDemoClock = clockfaces.filter(e => e.demo); // find demo-clock definition
                clockIndex = arrDemoClock ? clockfaces.indexOf(arrDemoClock[0]) : 0;
            } else if (clock) {
                clockIndex = clock.currentClockFaceIdx || 0;
				timerIDX = clock.getTypeIDX() || 0;
            }

            $SD.api.sendToPropertyInspector(
                jsn.context,
                { clock_index: clockIndex,
				timerIndex: timerIDX },
                this.type
            );
			//sends all the existing values to the PI
        } else { 
			//now if data is sent from the PI to the plugin
			if (jsn.payload.hasOwnProperty('clock_index')) { /* if there's no clock-definitions, so simply do nothing */
				/* set the appropriate clockface index as choosen from the popupmenu in PI */
				const clockIdx = Number(jsn.payload['clock_index']);
				$SD.api.setSettings(jsn.context, {
					context: jsn.context,
					clock_index: clockIdx,
					timer_index: clock.getTypeIDX(),
					rem_time: clock.getRemTime()
				});

            if (clock) {
                clock.setClockFaceNum(clockIdx);
                this.cache[jsn.context] = clock;
            } }//ifJSNhasOWNprop
			if(jsn.payload.hasOwnProperty('timerIndex')) {
				$SD.api.setSettings(jsn.context, {
					context: jsn.context,
					timer_index: Number(jsn.payload['timerIndex']),
					clock_index: clock.currentClockFaceIdx,
					rem_time: clock.getRemTime()
				});
				if (clock) { //if the clock exists, update the clocktype number
					clock.setClockTypeNum(Number(jsn.payload['timerIndex']));
					this.cache[jsn.context] = clock; //save the clock
				}					
			}//ifJSNpropTimertype
			
			}//else
    }
};


function AnalogClock (jsonObj) {
    var jsn = jsonObj,
        context = jsonObj.context,
        clockTimer = 0,
        clock = null,
        clockface = clockfaces[0],
        currentClockFaceIdx = 0,
		timerType = timerTypes[0],
		timerTypeIdx = 0,
        origContext = jsonObj.context,
        canvas = null,
        demo = false,
        count = Math.floor(Math.random() * Math.floor(10));


    function isDemo () {
        return demo;
    }

    function createClock (settings) {
        canvas = document.createElement('canvas');
        canvas.width = 144;
        canvas.height = 144;
        clock = new Clock(canvas);
        clock.setColors(clockface.colors);
		
		clock.setTimer(timerTypes[timerTypeIdx].max_time);
		clock.setType(timerTypes[timerTypeIdx].arcColour);
    }
	
	function resetCountdown() {
		clock.resetCountdown();
	}//resetCountdown()
	

    function toggleClock () {

        if (clockTimer === 0) {
            clockTimer = setInterval(function (sx) {

                if (demo) {
                    let c = -1;
                    if (count % 21 == 6) {
                        c = 0;
                    } else if (count % 21 === 3) {
                        c = 1;
                    } else if (count % 21 === 9) {
                        c = 2;
                    } else if (count % 21 === 12) {
                        c = 3;
                    } else if (count % 21 === 15) {
                        c = 4;
                    } else if (count % 21 === 18) {
                        c = 5;
                    }

                    if (c !== -1) {
                        setClockFaceNum(c, demo);
                    } else {
                        drawClock();
                    }
                } else {
                    drawClock();
                }

                count++;
				if(count%10 === 0) {
					$SD.api.setSettings(context, {
					context: context,
					rem_time: getRemTime(),
					clock_index: currentClockFaceIdx,
					timer_index: getTypeIDX()
				});
				//saves all the settings once every ten seconds
				//I originally only wanted to save it when exiting the current screen but it wont let me
				}
            }, 1000);
        } else {
            window.clearInterval(clockTimer);
            clockTimer = 0;
        }
    }

    function drawClock (jsn) {
        clock.drawClock();
        $SD.api.setImage(
            context,
            clock.getImageData()
        );
    }

    function setClockFace (newClockFace, isDemo) {
        clockface = newClockFace;
        demo = clockface.demo || isDemo;
        clock.setColors(clockface.colors);
        clockface.text !== true && $SD.api.setTitle(context, '', null);
        drawClock();
    }

    function setClockFaceNum (idx, isDemo) {
        currentClockFaceIdx = idx < clockfaces.length ? idx : 0;
        this.currentClockFaceIdx = currentClockFaceIdx;
        setClockFace(clockfaces[currentClockFaceIdx], isDemo);
    }
	
	function setClockType (newTimerType) {
		/*a new timer type has been selected from the PI*/
        let timerType = newTimerType;
        clock.setType(timerType.arcColour);
		clock.setTimer(timerType.max_time);
		clock.resetCountdown();
        drawClock();
    }

    function setClockTypeNum (idx) {
		/*get the index number of the clock type*/
        let currentClockTypeIdx= idx;
        timerTypeIdx = currentClockTypeIdx;
        setClockType(timerTypes[currentClockTypeIdx]);
    }
    function destroyClock () {
        if (clockTimer !== 0) {
            window.clearInterval(clockTimer);
            clockTimer = 0;
        }
    }
	function setRemTime(remTime) {
		clock.setRemTime(remTime);
	}
	function getRemTime() {
		return clock.getRemTime();
	}
	function getTypeIDX() {
		return timerTypeIdx;
	}
	
    createClock();
    return {
        clock: clock,
        clockTimer: clockTimer,
        clockface: clockface,
        currentClockFaceIdx: currentClockFaceIdx,
        name: name,
        drawClock: drawClock,
        toggleClock: toggleClock,
        origContext: origContext,
        setClockFace: setClockFace,
        setClockFaceNum: setClockFaceNum,
		setClockType: setClockType,
		setClockTypeNum: setClockTypeNum,
        destroyClock: destroyClock,
        demo: demo,
		resetCountdown: resetCountdown,
		setRemTime: setRemTime,
		getRemTime: getRemTime,
		getTypeIDX: getTypeIDX,
        isDemo: isDemo
    };
}
