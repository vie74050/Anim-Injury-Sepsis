
var isPlaying = true;
var maincontainer = "#stage";

var ptOfInjury = [300, 200];
var activeElems = {};

var rbc_options = {
	numOfSegments : 5,
	variations : .03, 
	sz : 100, 
	rot : -180,
	top : 257,
	speed : 3,  // whole numbers only 
	
};
var platelet_options = {
	numOfSegments : 6,
	variations : .06, 
	sz : 50, 
	rot : 30,
	top : 265,
	speed : 2, 
};
var monocyte_options = {
	numOfSegments : 4,
	variations : .06, 
	sz : 50, 
	rot : 270,
	top : 250,
	speed : 2 
}; 
var neutrophil_options = {
	numOfSegments : 6,
	variations : .07, 
	sz : 50, 
	rot : 200,
	top : 252,
	speed : 2,
};

$(document).ready(function() {
	reset();
	$(".pathway img, #systemic").draggable();
	
	$(".mac").on("click",function(){ 
		
		if ( $(this).hasClass("animate")){
			$(this).toggleClass("large"); 
			if ( $(this).hasClass("large") ){
				$(this).css("left", "25%");
			}else{
				$(this).css("left", "");
			}
		}
	
	});
	
}).tooltip();

$.fn.spawnCells = function(start_t, delay_dt, n, variation, options){
	var $elem = $(this);
	var k = $elem.attr("class").replace("cell","").replace("clickable","").replace("injury","").replace(/\ /g, "");
	
	// clone more
	// spawn more
	for (i = 1; i <= n; i++){
		
		var delay = start_t + (i)*delay_dt + variation*delay_dt*Math.random();
		setTimeout(function(elem){
			
			
			var $clone = $elem.clone().appendTo(maincontainer);
			
			if ( activeElems[k] == null ) {
				 activeElems[k] = [];
			}
			activeElems[k].push(new MakePath($clone, options));

		}, delay);
		
	}	
			
};

var MakePath = function($elem, options) {
	var params = {
		numOfSegments : 4,
		variations : .1, 
		sz : 50, 
		rot : 180* Math.random(),
		top : 460,
		speed : 6,
		type: "normal"
	};
	var me = this;
	this.tim ;
	this.mergeoptions = Object.assign(params, options);
	this.elem = $elem;
	this.cPoints = [];
	this.dx = 0;
	this.x1 = 0;
	this.y1 = 0;
	this.rot =  me.mergeoptions.rot * Math.random();
		
	// sets path
	this.updatePath = function(){
		var w = $(maincontainer).width() + me.mergeoptions.sz, 
			segment = w / me.mergeoptions.numOfSegments;
		var points = [], 
			i=0, 
			cPoints = [];
		
		cancelAnimationFrame(me.tim);
		
		me.x1 = - me.mergeoptions.sz;
		
		// update path, random variation
		me.cPoints = [];
		
		me.rot = me.mergeoptions.rot * Math.random();
		
		if (me.mergeoptions.path == null){
			// generated horizontal path, with y randomly varied by 'variations' from 'top'
			for ( i = 0; i < me.mergeoptions.numOfSegments + 1; i++) {
				points.push(segment * i );
				points.push(params.top + me.mergeoptions.top*me.mergeoptions.variations * Math.random());
			}
		}else{
			points = me.mergeoptions.path;
			//console.log(points);
		}
		
				
		me.points = points;		
		cPoints = Curve(me.points);
		//me.curvePoints = cPoints;
		me.cPoints = quantX(cPoints);
		me.animStart = window.performance.now();
	};
	
	// executes path
	this.path = function(time) {
		var normal = true;
		if(isPlaying){	
			if (me.dx > me.cPoints.length - 1 ){
				me.dx= 0;
				me.updatePath();
			}
			
			me.x1 = me.cPoints[me.dx] - me.mergeoptions.sz;
			me.y1 = me.cPoints[me.dx + 1];
			
			if (me.mergeoptions.state == 1 ){
				
				// clotting
				var minx_clot = ptOfInjury[0] + me.mergeoptions.speed*2*Math.random();
				var maxx_clot = minx_clot + me.mergeoptions.speed*3;
				
				if (me.elem.hasClass("platelet")){
					//looping
					if (me.x1 >= minx_clot && me.x1 <= maxx_clot ){
						 me.dx= 0;
					}
					
				}
				
				if (me.mergeoptions.type=="clot"){			
					me.y1 = me.cPoints[me.dx + 1] - 2*me.mergeoptions.variations * Math.random();
					if (me.x1 >= minx_clot && me.x1 <= maxx_clot ){
						 normal = false;
						 $("#platelet_group").delay(2000).fadeTo(2500,0.7);	
					}
				}	
				
				// remove normal monocyte, neutrophil
				if (me.mergeoptions.type=="removeonend"){			
					
					if (me.dx > me.cPoints.length - 3){
						//console.log(me.dx,me.cPoints.length - 2);
						cancelAnimationFrame(me.tim);
						$(me.elem).remove();
					}
				}	
				
				if ( me.mergeoptions.type=="phagocyte" ){			
					
					// switch to active
					if (me.y1 < 160){
						me.elem.addClass("active");
					}else{
						me.elem.removeClass("active");
					}
					
					if (me.x1 > me.mergeoptions.target.position().left-10 && normal){
						normal = false;
						me.mergeoptions.target.fadeOut(1000, function(){
							me.dx += me.mergeoptions.speed*2;
							me.mergeoptions.target.removeClass("active");
						});
						
					}else{
						
						me.mergeoptions.target.fadeIn(2000, function(){
							me.mergeoptions.target.addClass("active");
						});
					}
				}	
			}
			
			if (normal){
				me.dx += me.mergeoptions.speed*2;  // x-val must be even index 
			}
			
			// animate cells
			var rot1 =  me.rot  * Math.sin(me.x1*.01) ;
			me.elem.css({
				"left": me.x1 , 
				"top": me.y1,
				'transform' : 'rotate('+ rot1 +'deg)'
			});
		}
		
		me.tim = window.requestAnimationFrame( me.path );
		
	};
	
	if (isPlaying){
		this.updatePath();
		this.path();
	}
		
	return me;
};

/**
 * ANIMATION EVENTS
 */
function playpause(elem){
	isPlaying = !(isPlaying);
	
	if (isPlaying){
		$(elem).text("PAUSE");
	}else{
		$(elem).text("PLAY");
	}
}
function reset(elem){
	$.each(activeElems, function(i, obj){
		$.each(obj, function(i,me){
			cancelAnimationFrame(me.tim);
			$(me.elem).remove();
		});
		
	});
	
	$(".process_btn").attr('disabled', true);
	$("#splinter").slideUp();
	$("#wound").fadeOut();
	$(".injury").fadeTo(1,1).hide();
	$("#mastcell").fadeTo(500,0.3);
	$("#arterywall").removeClass("arterywallDilate arterywallConstrict");
	$("#injury_btn").attr('disabled', false);
	$(".pathway").fadeOut();
	$(".triggered").removeClass("triggered");
	$(".pathogen").removeClass("active").stop(true, true).fadeOut();
	$(".blue").removeClass("blue");
	$(".mac").removeClass("animate large");
	
	$(".rbc").spawnCells( 0, 1500, 3, 0.5, rbc_options);
		
	$(".platelet").spawnCells(1000, 2000, 2, 1, platelet_options);
	
	$(".monocyte").spawnCells(2000, 2500, 1, 0.7, monocyte_options);
	
	$(".neutrophil").spawnCells(500, 1000, 1, 0.5, neutrophil_options);
	
}
/* Trigger event handlers */
function injury(elem){
	
	$(elem).attr('disabled', true);
	$(".pathogen").removeClass("active");
	$("#wound").delay(700).fadeIn(1500);
	$("#splinter").slideDown(1000, function(){
			
			$("#mastcell").fadeTo(1500,1, function(){
				$("#mastcell_factors").fadeTo(1500,0.7, function(){
					$("#arterywall").addClass("arterywallConstrict");
					$(".process_btn").attr('disabled', false);
					
					$.each( activeElems["platelet"], function(i, ar){
						ar.mergeoptions.state = 1;
					});
					
					
					$(".platelet-clot").show().spawnCells(0, 1000, 2, 3, {
						numOfSegments : 4,
						variations : .1, 
						sz : 50, 
						rot : 30,
						top : 260,
						speed : 2, 
						state : 1,
						type: "clot"
					});
					$("#platelet_factors").fadeTo(1500,0.7);
					
				});
			});
			
			// pathogens
			$(".pathogen").each(function(){
				var fadeInt = 2000*(1+Math.random());
				var px = $(this).css("left");
				var py = $(this).css("top");
				//console.log(px);
				$(this).css({left: 350, top: 120, display:"block"});
				$(this).animate({
					left: px,
					top: py,
					opacity: 1
				}, fadeInt, function(){
					$(this).addClass("active");
				});
											
			});
	});

}

function vasodilation(elem){
	$("#arterywall").addClass("arterywallDilate").removeClass("arterywallConstrict");
		
	if ( ! $(elem).hasClass("triggered") ){
		
		$("#mastcell_factors").fadeTo(3000,0, function(){
			$(this).hide();
		});
		
		$(elem).addClass("triggered");
		
		//phagocytosis trigger
		var mono_newoptions = $.extend({}, monocyte_options);
		var target_pathogen = $(".pathogen:eq(0)");
		var targx = target_pathogen.position().left;// + target_pathogen.width() + $(".monocyte").width();
		var targy = target_pathogen.position().top +10;
		mono_newoptions.type = "phagocyte";
		//mono_newoptions.rot = 180;
		mono_newoptions.path = [0, 255, 54, 248, 240, 240, 243, 232, 247, 180, targx-30, targy+10, targx, targy, targx+$(".monocyte").width(), targy];
		mono_newoptions.state = 1;
		mono_newoptions.target = target_pathogen;
		$(".monocyte:eq(0)").attr("title", "Activated Monocytes become macrophages (phagocyte)")
							.spawnCells(0, 0, 1, 3, mono_newoptions);
		
		$.each( activeElems["monocyte"], function(i, me){
			//me.mergeoptions.path = [0, 255, 54, 248, 240, 240, 243, 232, 247, 180, targx,targy];
			me.mergeoptions.state = 1;
			me.mergeoptions.type = "removeonend";
		});
		
		var neut_newoptions = $.extend({}, neutrophil_options);
		target_pathogen = $(".pathogen:eq(1)");
		targx = target_pathogen.position().left;// + target_pathogen.width() + $(".neutrophil").width();
		targy = target_pathogen.position().top +10 ;
		neut_newoptions.type = "phagocyte";
		neut_newoptions.path = [0, 260, 530, 238, 545, 200, 548, 181, targx-30, targy, targx, targy, targx+$(".monocyte").width(), targy];
		neut_newoptions.state = 1;
		neut_newoptions.target = target_pathogen;
		$(".neutrophil:eq(0)").attr("title", "Activated Neutrophils engulf bacteria and other foreign particles (phagocytosis)")
							  .spawnCells(0, 0, 1, 3, neut_newoptions);
		
		$.each( activeElems["neutrophil"], function(i, me){
			me.mergeoptions.state = 1;
			me.mergeoptions.type = "removeonend";
		});
	}
		
	if ( $(elem).hasClass("blue") ){
		$("#pathway_vaso").hide();
		$(elem).removeClass("blue");
	}else{
		$(".pathway").hide();
		$(".blue").removeClass("blue");
		$("#pathway_vaso").show();
		$(elem).addClass("blue");
	}
	
}

function clotting(elem){
	
	if ( ! $(elem).hasClass("triggered") ){
		$(elem).addClass("triggered");
		
		$(".platelet-clot").show().spawnCells(0, 500, 3, 3, {
			numOfSegments : 4,
			variations : .2, 
			sz : 50, 
			rot : 180,
			top : 245,
			speed : 2, 
			state: 1,
			type: "clot"
		});
		
		$("#fibrin").delay(3500).fadeIn(2000, function(){
			
			$(".rbc-clot").fadeTo(100,.5).spawnCells(0, 500, 3, 3, {
				numOfSegments : 3,
				variations : .1, 
				sz : 50, 
				rot : 60,
				top : 248,
				speed : 2, 
				state: 1,
				type: "clot"
			});
			$(this).appendTo(maincontainer);
		});
		
	}
	
	if ( $(elem).hasClass("blue") ){
		$("#pathway_clotting").hide();
		$(elem).removeClass("blue");
	}else{
		$(".pathway").hide();
		$(".blue").removeClass("blue");
		$("#pathway_clotting").show();
		$(elem).addClass("blue");
	}
	
}

function complement_cascade(elem){
	
	if ( ! $(elem).hasClass("triggered") ){
		$(elem).addClass("triggered");
		$(".mac").addClass("animate");
		$(".pathogen").addClass("active");
	}
	
	if ( $(elem).hasClass("blue") ){
		$("#pathway_complement").hide();
		$(elem).removeClass("blue");
	}else{
		$(".pathway").hide();
		$(".blue").removeClass("blue");
		$("#pathway_complement").show();
		$(elem).addClass("blue");
	}
}

function ards(elem){
	
	if ( $(elem).hasClass("blue") ){
		$("#systemic").hide();
		$(elem).removeClass("blue");
	}else{
		$(".pathway").hide();
		$(".blue").removeClass("blue");
		$("#systemic").show();
		$(elem).addClass("blue");
	}
	
}

/**
 * HELPERS
 */


function quantX(pts) {

	var min = 99999999, max = -99999999, x, y, i, p = pts.length, res = [];

	for ( i = 0; i < pts.length - 1; i += 2) {
		if (pts[i] > max)
			max = pts[i];
		if (pts[i] < min)
			min = pts[i];
	}
	max = max - min;

	function _getY(x) {

		var t = p, ptX1, ptX2, ptY1, ptY2, f, y;

		for (; t >= 0; t -= 2) {
			ptX1 = pts[t];
			ptY1 = pts[t + 1];

			if (x >= ptX1) {
				//p = t + 2;

				ptX2 = pts[t + 2];
				ptY2 = pts[t + 3];

				f = (ptY2 - ptY1) / (ptX2 - ptX1);
				y = (ptX1 - x) * f;

				return ptY1 - y;
			}
		}
	}

	for ( i = 0; i < max; i++) {
		res.push(i);
		res.push(_getY(i));
	}
	return res;
}

Number.prototype.clamp = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

/*
 *		animation frame timing
 */
( function() {
	var lastTime = 0;
	var vendors = ['webkit', 'moz'];
	for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame)
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() {
				
				callback(currTime + timeToCall);
				
			}, timeToCall);
			
			lastTime = currTime + timeToCall;
			
			return id;
		};

	if (!window.cancelAnimationFrame)
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
}());

var Curve = function(pts, tension, numOfSegments) {

	// use input value if provided, or use a default value
	tension = (tension != 'undefined') ? tension : 0.5;
	numOfSegments = numOfSegments ? numOfSegments : 16;

	var _pts = [], 
		res = [], // clone array
		x, y, // our x,y coords
		t1x, t2x, t1y, t2y, // tension vectors
		c1, c2, c3, c4, // cardinal points
		st, st2, st3, st23, st32, // steps
		t, i, l, r = 0;

	// clone array so we don't change the original
	_pts = pts.concat();

	_pts.unshift(pts[1]);
	//copy 1. point and insert at beginning
	_pts.unshift(pts[0]);
	_pts.push(pts[pts.length - 2]);
	//copy last point and append
	_pts.push(pts[pts.length - 1]);

	//this.moveTo(pts[0], pts[1])

	// Calculations:

	// 1. loop goes through point array
	// 2. loop goes through each segment between the two points
	l = (_pts.length - 4);
	for ( i = 2; i < l; i += 2) {

		tension = 1.5 * Math.random() - 0.5;

		for ( t = 0; t <= numOfSegments; t++) {
			// calc tension vectors
			t1x = (_pts[i + 2] - _pts[i - 2]) * tension;
			t2x = (_pts[i + 4] - _pts[i]) * tension;

			t1y = (_pts[i + 3] - _pts[i - 1]) * tension;
			t2y = (_pts[i + 5] - _pts[i + 1]) * tension;

			// pre-calc steps
			st = t / numOfSegments;
			st2 = st * st;
			st3 = st2 * st;
			st23 = st3 * 2;
			st32 = st2 * 3;

			// calc cardinals
			c1 = st23 - st32 + 1;
			c2 = -(st23) + st32;
			c3 = st3 - 2 * st2 + st;
			c4 = st3 - st2;

			// calc x and y cords with common control vectors
			x = c1 * _pts[i] + c2 * _pts[i + 2] + c3 * t1x + c4 * t2x;
			y = c1 * _pts[i + 1] + c2 * _pts[i + 3] + c3 * t1y + c4 * t2y;

			res[r++] = x;
			res[r++] = y;

		} //for t
	}//for i

	l = res.length;

	return res;

};
//func ext

