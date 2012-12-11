// global variable definitions
var ui = [];
var container;
var userInfo;

// bootstrap the app
$(document).ready(function() {
	initialize();
});

// set up the app to a working state
function initialize() {
	initInterface();
	
	// load the first screen
	if (getLoginDetails() && localStorage.loginToken) {
		updateInformation();
	} else {
		localStorage.removeItem("loginToken");
		setScreen(screenIntro);
	}
}

// create the general interface elements
function initInterface() {
	container = $("#container");
	
	// title bar
	ui.titleBar = $("<div />");
	ui.titleBar.appendTo(container);
	ui.titleBar.attr({
		id: "titleBar"
	});
	
	// title bar text
	ui.titleBarText = $("<p />");
	ui.titleBarText.appendTo(ui.titleBar);
	ui.titleBarText.attr({
		id: "titleBarText"
	});
	updateTitle();
	
	// title bar button
	ui.titleButton = $("<a />");
	ui.titleButton.appendTo(ui.titleBar);
	ui.titleButton.attr({
		id: "titleBarButton"
	});
	
	ui.titleButtonLeft = $("<div />");
	ui.titleButtonLeft.addClass("titleBarLeft");
	ui.titleButtonLeft.appendTo(ui.titleButton);
	
	ui.titleButtonText = $("<div />");
	ui.titleButtonText.attr({
		id: "titleBarButtonText"
	});
	ui.titleButtonText.addClass("titleBarMiddle");
	ui.titleButtonText.appendTo(ui.titleButton);
	ui.titleButtonText.text("Cancel");
	
	ui.titleButtonRight = $("<div />");
	ui.titleButtonRight.addClass("titleBarRight");
	ui.titleButtonRight.appendTo(ui.titleButton);
	
	// create screen container
	ui.screenContainerParent = $("<div />");
	ui.screenContainerParent.appendTo(container);
	ui.screenContainerParent.attr({
		id: "screenContainerParent"
	});
	
	ui.screenContainer = $("<div />");
	ui.screenContainer.appendTo(ui.screenContainerParent);
	ui.screenContainer.attr({
		id: "screenContainer"
	});
}

function updateTitle(newTitle) {
	if (newTitle != null) {
		$("title").text(newTitle);
	}
	
	ui.titleBarText.text($("title").text());
}


function setScreen(screen) {
	var targetID = "screen-" + screen.id;
	
	// does it already exist?
	if ($("#" + targetID).length > 0) {
		$("#" + targetID).remove();
	}
	
	// create a container div for the new screen
	var container = $("<div />");
	container.data("conf", screen);
	container.appendTo(ui.screenContainer);
	container.addClass("screen");
	container.attr({
		id: targetID
	});
	
	// general changes
	updateTitle(screen.title);
	
	if (screen.titleButton) {
		ui.titleButton.fadeIn(500);
		ui.titleButtonText.text(screen.titleButton.text);
		ui.titleButton.unbind("click");
		ui.titleButton.click(function() {
			screen.titleButton.event();
		});
	} else {
		ui.titleButton.fadeOut(500);
	}
	
	// render the screen
	screen.setup(container);
	
	// is a screen already being displayed?
	if (ui.screen != null) {
		// attempt to intelligently switch screens
		if (ui.screen.data("conf") && ui.screen.data("conf").parent == screen.id || screen.id == "intro") { // go "back"
			// the old (current) screen is a child of the new screen, so the old screen should
			// slide out right while the new one (the parent) slides in from the left
			container.css("left", "-" + (ui.screenContainer.width()) + "px");
			
			container.animate({
				left: "0px"
			}, 500, "swing", null);
			
			ui.screen.animate({
				left: (ui.screenContainer.width() * 2) + "px"
			}, 500, "swing", function() {
				$(this).remove();
			});
		} else { // go forward to a new screen
			// the new screen is probably a child of the current one (even if not explicitly defined)
			// so the old (current) screen should slide out left, while the new one slides in from the right
			container.css("left", (ui.screenContainer.width()) + "px");
			
			container.animate({
				left: "0px"
			}, 500, "swing", null);
			
			ui.screen.animate({
				left: "-" + (ui.screenContainer.width()) + "px"
			}, 500, "swing", function() {
				$(this).remove();
			});
		} 
	}
	
	// update current screen
	ui.screen = container;
}

var globalTension = 0.35;
var globalInterval = 0;
var sigIntro = null;

var screenSignature = {
	id: "signature",
	title: "Senior Signature",
	parent: "portal",
	
	titleButton: {
		text: "Cancel",
		event: function() {
			navigator.notification.alert("Are you sure you want to go back? Any changes you've made will not be saved.", function(response) {
				if (response == 2) {
					setScreen(screenPortal);
				}
			}, "Return to Portal", "Stay Here,Go Back");
		}
	},
	
	setup: function(container) {
		container.css({
            backgroundColor: "rgba(253, 249, 207, 0.2)",
            boxShadow: "inset 0px 0px 900px rgba(253, 249, 207, 0.8)",
		});
		
		sigPaths = [];
		
		var intro = $("<p />");
		sigIntro = intro;
		intro.appendTo(container);
		intro.css({
			margin: "100px",
			fontSize: "44px",
			textAlign: "center"
		});
		intro.text("Either with a stylus or your finger, sign your personal signature below.");
		
		var artHolder = $("<div />");
		artHolder.appendTo(container);
		artHolder.css({
			width: "1800px",
			height: "800px",
			marginLeft: "auto",
			marginRight: "auto"
		});
		
		var canvasHolder = $("<div />");
		canvasHolder.appendTo(artHolder);
		canvasHolder.css({
			width: "1500px",
			height: "800px",
			border: "solid 2px rgba(150, 150, 150, 1)",
			float: "left",

		});
		
		var buttonHolder = $("<div />");
		buttonHolder.appendTo(artHolder);
		buttonHolder.css({
			float: "right",
			width: "240px",
			height: "820px"
		});
		
		var undoButton = $("<a />");
		undoButton.appendTo(buttonHolder);
		undoButton.text("Undo");
		undoButton.addClass("signatureButton");
		undoButton.addClass("disabled");
		undoButton.attr({
			id: "signatureUndoButton"
		});
		
		undoButton.click(function() {
			if ($(this).hasClass("disabled")) {
				return;
			}
			
			sigPaths.remove(sigPaths.length - 1);
			redrawCanvas(canvas, ctx);
			
			if (sigPaths.length <= 0) {
				undoButton.addClass("disabled");
				clearButton.addClass("disabled");
				doneButton.text("Cancel");
			}
		});
		
		var clearButton = $("<a />");
		clearButton.appendTo(buttonHolder);
		clearButton.text("Clear");
		clearButton.addClass("signatureButton");
		clearButton.addClass("disabled");
		clearButton.attr({
			id: "signatureClearButton"
		});
		
		clearButton.click(function() {
			if ($(this).hasClass("disabled")) {
				return;
			}
			
			penData = null;
			sigPaths = [];
			redrawCanvas(canvas, ctx);
			
			undoButton.addClass("disabled");
			clearButton.addClass("disabled");
			doneButton.addClass("disabled");
		});
				
		var doneButton = $("<a />");
		doneButton.appendTo(buttonHolder);
		doneButton.text("Done");
		doneButton.addClass("signatureButton");
		doneButton.addClass("disabled");
		doneButton.attr({
			id: "signatureDoneButton"
		});
		
		doneButton.click(function() {
			if ($(this).hasClass("disabled")) {
				return;
			}
			
			navigator.notification.alert("Are you sure you want to use this signature?", function(response) {
				if (response == 2) {
					var img = canvas[0].toDataURL("image/png");
					// name was valid, so upload it to the server
					updateInformation({
						path: "c-signature.php",
						data: {user: getLoginDetails().user, token: localStorage.loginToken, signature: img}
					});
				}
			}, "Signature Confirmation", "Cancel,Use Signature");
			
			//
			//$.post("https://jacketeer.org/app/up.php", {img: img}, function() {
			//	alert("done!");
			//});
		});
		
		var canvas = $("<canvas />");
		canvas.appendTo(canvasHolder);
		canvas.attr({
			width: canvasHolder.innerWidth(),
			height: canvasHolder.innerHeight(),
			id: "handwritingCanvas"
		});
		canvas.css({
			backgroundColor: "solid rgba(255, 255, 255, 1)",
            boxShadow: "inset 0px 0px 15px 10px rgba(100, 100, 0, 0.05)"
		});
		canvas.data("paths", []);
		
		var ctx = canvas[0].getContext("2d");
		
        // tips holder left
		var tipsHolderLeft = $("<div />");
		tipsHolderLeft.appendTo(container);
		tipsHolderLeft.css({
                       marginLeft: "130px",
                       marginTop: "50px",
                       width: "800px",
                       float: "left"
                       });
		
		// tips list
		var tipsListLeft = $("<ul />");
		tipsListLeft.appendTo(tipsHolderLeft);
		tipsListLeft.css({
                         //listStyle: "disc outside none",
                         marginTop: "10px"
        });
		
		var tipsLeft = [
                    "Sign as you normally would; you can use your full name, your initials, or whatever you go by.",
                    "Go slow and naturally. Take your time, and make it look nice.",
                    ];
		
		for (var i = 0; i < tipsLeft.length; i ++) {
			var tip = tipsLeft[i];
			
			var li = $("<li />");
			li.appendTo(tipsListLeft);
			li.css({
                   fontSize: "36px",
                   //textIndent: "60px",
                   //marginLeft: "80px",
                   lineHeight: "1.4em",
                   marginBottom: "30px"
                   });
			li.html(tip);
		}
        
        // tips holder
		var tipsHolderRight = $("<div />");
		tipsHolderRight.appendTo(container);
		tipsHolderRight.css({
                       marginRight: "130px",
                       marginTop: "30px",
                       width: "800px",
                       float: "right"
                       });
		
		// tips list
		var tipsListRight = $("<ul />");
		tipsListRight.appendTo(tipsHolderRight);
		tipsListRight.css({
                     //listStyle: "disc outside none",
                     marginTop: "10px"
                     });
		
		var tipsRight = [
                    "You can always redo the signature. Don't worry about getting it perfect the first time.",
                    "If you need a stylus, go find Ruff (room 138). He's there 24/7, 365 days per year (sometimes 366!).",
                    ];
		
		for (var i = 0; i < tipsRight.length; i ++) {
			var tip = tipsRight[i];
			
			var li = $("<li />");
			li.appendTo(tipsListRight);
			li.css({
                   fontSize: "36px",
                   //textIndent: "60px",
                   //marginLeft: "80px",
                   lineHeight: "1.4em",
                   marginBottom: "30px"
                   });
			li.html(tip);
		}
		
		// iPad touch events
		canvas[0].addEventListener("touchstart", function(e) {
			penData = {
				points: [],
				lastEvent: 0
			};
			
			// draw the first point
			addPenPosition(ctx, canvas, e);
		}, false);
		
		canvas[0].addEventListener("touchmove", function(e) {
			// are we drawing?
			if (penData == null) {
				return;
			}
			
			// test if it's time for another point
			var cur = currentTime();
			var ignore = cur - penData.lastEvent < globalInterval;
			
			// draw the point
			addPenPosition(ctx, canvas, e, ignore);
		}, false);
		
		canvas[0].addEventListener("touchend", function(e) {
			// are we drawing?
			if (penData == null) {
				return;
			}
			
			// draw the last point
			try {
				addPenPosition(ctx, canvas, e);
			} catch (err) {}
			
			// remove any points to ignore
			for (var i = penData.points.length - 1; i >= 0; i --) {
				if (penData.points[i][3]) {
					penData.points.remove(i);
				}
			}
			
			// end the drawing
			sigPaths.push(penData.points);
			penData = null;
			lastPointIndex = (- 1);
			
			redrawCanvas(canvas, ctx);
			
			// change button statuses
			clearButton.removeClass("disabled");
			undoButton.removeClass("disabled");
			doneButton.removeClass("disabled");
		}, false);
	}
};

var sigPaths = null;
var penData = null;

function currentTime() {
	return (new Date()).getTime();
}

var lastPointIndex = (- 1);

function addPenPosition(ctx, canvas, e, ignore) {
	if (ignore === undefined) {
		ignore = false;
	}
	
	var pos = getPenPosition(canvas, e);
	var velocity = 0;
	
	if (penData.points.length > 0) {
		var lastPoint = penData.points[penData.points.length - 1];
		velocity = dist(pos, penData.points[lastPointIndex]);
	}
	
	pos.push(velocity);
	pos.push(ignore);
	penData.points.push(pos);
	
	if (! ignore) {
		lastPointIndex = penData.points.length - 1;
		penData.lastEvent = currentTime();
	}
	
	redrawCanvas(canvas, ctx);
}

function dist(p1, p2) {
	return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1],  2));
}

function redrawCanvas(canvas, ctx) {
	// clear canvas
	ctx.clearRect(0, 0, canvas.width(), canvas.height());
	
	// draw the current path	
	if (penData) {
		drawSpline(ctx, penData.points, globalTension, false);
	}
	
	// draw the rest of the paths
	if (sigPaths.length > 0) {
		for (var i = 0; i < sigPaths.length; i ++) {
			drawSpline(ctx, sigPaths[i], globalTension, false);
		}
	}
}

function getPenPosition(canvas, e) {
	var ep = canvas.offset();
	return [e.targetTouches[0].pageX - ep.left, e.targetTouches[0].pageY - ep.top];
}

var screenQuote = {
	id: "quote",
	title: "Featured Quote",
	parent: "portal",
	
	titleButton: {
		text: "Cancel",
		event: function() {
			navigator.notification.alert("Are you sure you want to go back? This will revert your quote to its previous state.", function(response) {
				if (response == 2) {
					setScreen(screenPortal);
				}
			}, "Return to Portal", "Stay Here,Go Back");
		}
	},
	
	setup: function(container) {
		container.css({
            backgroundColor: "rgba(253, 249, 207, 0.2)",
            boxShadow: "inset 0px 0px 900px rgba(253, 249, 207, 0.8)",
		});
		
		// intro text
		var introText = $("<p />");
		introText.appendTo(container);
		introText.css({
			textAlign: "center",
			fontSize: "38px",
			lineHeight: "1.6em",
			margin: "50px",
			color: "rgba(0, 0, 0, 0.7)"
		});
		introText.html("Tap the area below to edit your quote. Keep it appropriate&ndash;otherwise, we'll draw a frowny face next to your portrait. Be creative and remember to give credit to the person who originally said it, unless that was you. If your quote is in a language other than English, consider including a translation.");
		
		// text field
		var textAreaHolder = $("<div />");
		textAreaHolder.appendTo(container);
		textAreaHolder.css({
			textAlign: "center"
		});
		
		var textArea = $("<textarea />");
		textArea.appendTo(textAreaHolder);
		textArea.css({
			width: "1600px",
			height: "300px",
			fontSize: "44px",
			padding: "20px",
			lineHeight: "1.6em"
		});
		textArea.attr({
			placeholder: "\"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse vitae nisi tortor, ac posuere massa. Etiam suscipit dolor at mi tincidunt dignissim. In hac habitasse platea dictumst.\" —Dan Ruff"
		});
		textArea.val(userInfo.Quote ? userInfo.Quote : "");
		
		// submit button
		var submit = $("<input type=\"button\" />");
		submit.appendTo(textAreaHolder);
		submit.css({
			fontSize: "68px",
            		backgroundColor: "rgba(100, 100, 0, 0.1)",
            		textAlign: "center",
            		marginTop: "100px"
		});
		submit.val("Submit Quote");
		
		submit.click(function() {
			var quote = textArea.val();
			
			if (quote.length <= 0) {
				return navigator.notification.alert("Please fill in a quote! If you're not ready to submit your quote, hit cancel at the top-right of the screen.", null, "Empty Quote", "Oops!");
			}
			
			// name was valid, so upload it to the server
			updateInformation({
				path: "c-quote.php",
				data: {user: getLoginDetails().user, token: localStorage.loginToken, quote: quote}
			});
		});
	}
};

var demoName = null;
var screenName = {
	id: "name",
	title: "Preferred Name",
	parent: "portal",
	
	titleButton: {
		text: "Cancel",
		event: function() {
			navigator.notification.alert("Are you sure you want to go back? Any changes you've made will not be saved.", function(response) {
				if (response == 2) {
					setScreen(screenPortal);
				}
			}, "Return to Portal", "Stay Here,Go Back");
		}
	},
	
	setup: function(container) {
		container.css({
            backgroundColor: "rgba(253, 249, 207, 0.2)",
            boxShadow: "inset 0px 0px 900px rgba(253, 249, 207, 0.8)",
		});
		
		var loginDetails = getLoginDetails();
		var backupName = userInfo.FirstName ? userInfo.FirstName + " " + userInfo.LastName : "John Doe";
		var name = userInfo.PreferredName ? userInfo.PreferredName : backupName;
		
		// intro
		var introText = $("<p />");
		introText.appendTo(container);
		introText.css({
			textAlign: "center",
			fontSize: "38px",
			lineHeight: "1.6em",
			margin: "50px",
			color: "rgba(0, 0, 0, 0.7)"
		});
		introText.html("Please enter your name exactly as you want it to appear in the yearbook next to your senior portrait.");
		
		// name holder
		var nameHolder = $("<div />");
		nameHolder.appendTo(container);
		nameHolder.css({
			marginLeft: "auto",
			marginRight: "auto",
			width: "1800px"
		});
		
		// name
		var inputName = $("<input type=\"text\" />");
		inputName.appendTo(nameHolder);
		inputName.attr({
			name: "inputName",
			placeHolder: "John Doe",
			autoCorrect: "off"
		});
		inputName.css({
			fontSize: "72px",
			padding: "10px",
			width: "1350px",
			marginRight: "10px",
			padding: "20px"
		});
		inputName.val(name);
		inputName.keyup(function() {
			demoName.html($(this).val().replace(/ /g, "<br />"));
		});
		
		// submit
		var submit = $("<input type=\"button\" />");
		submit.appendTo(nameHolder);
		submit.css({
			fontSize: "68px",
            		backgroundColor: "rgba(100, 100, 0, 0.1)"
		});
		submit.val("Confirm");
		
		submit.click(function() {
			// validate the name they've entered
			var valid = true;
			var invalidReason;
			
			var name = inputName.val().trim();
			var words = name.split(" ");
			
			if (words.length < 2 || words.length > 4) {
				valid = false;
				invalidReason = "Please enter only your first name and last name. You should only enter more if you go by two or more names (such as \"Sarah Jane Smith\"). See the tips below for more details.";
			}
			
			if (! valid) {
				return navigator.notification.alert(invalidReason, null, "Invalid Name", "Oops!");
			}
			
			// name was valid, so upload it to the server
			updateInformation({
				path: "c-name.php",
				data: {user: getLoginDetails().user, token: localStorage.loginToken, name: name}
			});
		});
		
		// submit by enter on input field
		inputName.keypress(function(e) {
			if (e.which == 13) {
				submit.click();
				$(this).blur(); // hide the iPad keyboard
				
				e.preventDefault();
				return false;
			}
		});
		
		// tips holder
		var tipsHolder = $("<div />");
		tipsHolder.appendTo(container);
		tipsHolder.css({
			marginLeft: "130px",
			marginTop: "70px",
			width: "900px",
			float: "left"
		});
		
		// tips header
		var tipsHeader = $("<h2 />");
		tipsHeader.appendTo(tipsHolder);
		tipsHeader.css({
			fontFamily: "\"Helvetica Neue Bold\", \"HelveticaNeue-Bold\"",
			fontSize: "36px"
		});
		tipsHeader.text("Name Instructions:");
		
		// tips list
		var tipsList = $("<ul />");
		tipsList.appendTo(tipsHolder);
		tipsList.css({
			//listStyle: "disc outside none",
			marginTop: "10px"
		});
		
		var tips = [
			"You <strong>must</strong> use your first name (the name you go by) and your full, legal last name.",
			"Do <strong>not</strong> include your middle name, unless you go by two first names.",
			"Enter your name exactly as you want it to appear in the book, including spelling, spaces, punctuation, and capitalization.",
			"You don't have to use your legal first name, but you must use your legal last name."
		];
		
		for (var i = 0; i < tips.length; i ++) {
			var tip = tips[i];
			
			var li = $("<li />");
			li.appendTo(tipsList);
			li.css({
				fontSize: "36px",
				//textIndent: "60px",
				//marginLeft: "80px",
				lineHeight: "1.4em",
				marginBottom: "30px"
			});
			li.html(tip);
		}
		
		// demo holder
		var demoHolder = $("<div />");
		demoHolder.appendTo(container);
		demoHolder.css({
			marginRight: "130px",
			marginTop: "70px",
			width: "800px",
			float: "right"
		});
		
		var demoHeader = $("<h2 />");
		demoHeader.appendTo(demoHolder);
		demoHeader.css({
			fontFamily: "\"Helvetica Neue Bold\", \"HelveticaNeue-Bold\"",
			fontSize: "48px",
			color: "rgba(0, 0, 0, 0.3)"
		});
		demoHeader.text("EXAMPLE");
		
		var demoBox = $("<div />");
		demoBox.appendTo(demoHolder);
		demoBox.css({
			border: "solid 6px rgba(0, 0, 0, 0.4)",
			width: "748px",
			padding: "20px",
			marginTop: "20px",
			backgroundColor: "rgb(100, 100, 100)"
		});
		
		var demoPortrait = $("<div />");
		demoPortrait.appendTo(demoBox);
		demoPortrait.css({
			float: "left",
			border: "solid 4px rgba(0, 0, 0, 0.5)",
			width: "300px",
			height: "400px",
			backgroundColor: "rgb(200, 200, 200)",
			backgroundImage: "url(css/assets/executive.png)",
			backgroundRepeat: "none",
			backgroundPosition: "50% 0%"
		});
		
		var demoInfo = $("<div />");
		demoInfo.appendTo(demoBox);
		demoInfo.css({
			float: "right",
			width: "400px"
		});
		
		demoName = $("<h3 />"); // this is global because we're on a deadline!
		demoName.appendTo(demoInfo);
		demoName.css({
			color: "white",
			fontFamily: "\"Helvetica Neue Bold\", \"HelveticaNeue-Bold\"",
			fontSize: "56px",
			textTransform: "uppercase"
		});
		demoName.html(name.replace(/ /g, "<br />"));
		
		var demoQuote = $("<p />");
		demoQuote.appendTo(demoInfo);
		demoQuote.css({
			color: "white",
			fontSize: "28px",
			marginTop: "20px",
			lineSpacing: "1.5em"
		});
		demoQuote.html("\"This is an example quote which will be replaced by your real quote in the book.\"<br />&ndash;John Doe");
		
		var demoSignature = $("<img />");
		demoSignature.appendTo(demoInfo);
		demoSignature.attr({
			src: "css/assets/jdoe.png",
			width: "292",
			height: "57"
		});
		demoSignature.css({
			marginTop: "40px"
		});
		
		// end demo box
		var clear = $("<div />");
		clear.appendTo(demoBox);
		clear.css("clear", "both");
		
		// reminder/disclaimer about example
		var exampleReminder = $("<p />");
		exampleReminder.appendTo(demoHolder);
		exampleReminder.css({
			marginTop: "7px",
			fontSize: "22px",
			lineHeight: "1.4em"
		});
		exampleReminder.html("This example is only to help you visualize layout. The picture, quote, and signature are placeholders. Don't worry about your name fitting on the lines&ndash;they are not the actual size as they will be in the book. We will make sure your name fits!");
	}
};

var screenPortal = {
	id: "portal",
	title: "Jacketeer 2013",
	parent: "intro",
	
	titleButton: {
		text: "Sign Out",
		event: function() {
			navigator.notification.alert("Are you sure you want to sign out?", function(response) {
				if (response == 2) {
					localStorage.removeItem("loginDetails");
					localStorage.removeItem("loginToken");
					setScreen(screenIntro);
				}
			}, "Sign Out", "Cancel,Sign Out");
		}
	},
	
	setup: function(container) {
		if (userInfo.PreferredName) {
			updateTitle(userInfo.PreferredName);
		} else {
			updateTitle(localStorage.loginDetails.user);
		}
		
		container.css({
			backgroundColor: "rgba(253, 249, 207, 0.2)",
            boxShadow: "inset 0px 0px 900px rgba(253, 249, 207, 0.8)",
		});
		
		var introText = $("<p />");
		introText.appendTo(container);
		introText.css({
			textAlign: "center",
			fontSize: "38px",
			lineHeight: "1.6em",
			margin: "50px",
			color: "rgba(0, 0, 0, 0.7)"
		});
		introText.html("To make your yearbook portrait more personal, tap on one of the areas below. If you want to revisit one of the sections, you can always go back to it. Make sure that you complete every item; your total progress is at the bottom. A yearbook is a lifelong memory, so make it yours!");
		
		// sections to complete
		var sections = [
			{
				id: "name",
				title: "Preferred Name",
				description: "The name you want to be used next to identify you in the yearbook.",
				complete: (userInfo.PreferredName != null)
			},
			
			{
				id: "signature",
				title: "Personal Signature",
				description: "Your personal, hand-written signature, done from your iPad.",
				complete: (userInfo.Signature != null)
			},
			
			{
				id: "quote",
				title: "Featured Quote",
				description: "An inspiring, witty, or memorable quote of your choice.",
				complete: (userInfo.Quote != null)
			}
		];
        
		var total = 0;
		
		for (var i = 0; i < sections.length; i ++) {
			var section = sections[i];
			
			if (section.complete) {
				total ++;
			}
			
			var sectionButton = $("<a />");
			sectionButton.appendTo(container);
			sectionButton.css({
				display: "block",
				margin: "60px",
				padding: "70px",
				paddingLeft: "225px",
				backgroundColor: "rgba(253, 249, 207, 1)",
				backgroundImage: "url('css/assets/" + (section.complete ? "accept" : "alert") + ".png')",
				backgroundPosition: "50px 50%",
				backgroundRepeat: "no-repeat",
				borderRadius: "15px",
				marginBottom: "30px !important",
				position: "relative",
                border: "solid 2px rgba(150, 150, 150, 1)",
                boxShadow: "0px 0px 15px 5px rgba(255, 255, 255, 0.5)",
                boxShadow: "inset 0px 0px 20px rgba(100, 100, 0, 0.1)",
			});
			
			sectionButton.data("section", section);
			sectionButton.click(function() {
				var selectedSection = $(this).data("section");
				
				if (selectedSection.id == "name") {
					setScreen(screenName);
				} else if (selectedSection.id == "signature") {
					setScreen(screenSignature);
				} else if (selectedSection.id == "quote") {
					setScreen(screenQuote);
				}
			});
			
			var header = $("<h1 />");
			header.appendTo(sectionButton);
			header.css({
				fontFamily: "\"Helvetica Neue Bold\", \"HelveticaNeue-Bold\"",
				fontSize: "48px",
				color: "rgba(0, 0, 0, 0.7)"
			});
			header.text(section.title);
			
			var description = $("<h2 />");
			description.appendTo(sectionButton);
			description.css({
				fontFamily: "\"Helvetica Neue\", \"HelveticaNeue\"",
				fontSize: "36px",
				color: "rgba(0, 0, 0, 0.7)",
				marginTop: "15px"
			});
			description.text(section.description);
			
			var status = $("<h3 />");
			status.appendTo(sectionButton);
			status.css({
				fontFamily: "\"Helvetica Neue Bold\", \"HelveticaNeue-Bold\"",
				fontSize: "36px",
				color: "rgba(0, 0, 0, 0.7)",
				position: "absolute",
				right: "150px",
				top: "50%",
				marginTop: "-14px"
			});
			status.text(section.complete ? "COMPLETE" : "INCOMPLETE");
			
			var arrow = $("<h4 />");
			arrow.appendTo(sectionButton);
			arrow.css({
				fontFamily: "\"Helvetica Neue Light\", \"HelveticaNeue-Light\"",
				fontSize: "70px",
				color: "rgba(0, 0, 0, 0.4)",
				position: "absolute",
				right: "50px",
				top: "50%",
				marginTop: "-40px"
			});
			arrow.text(">");
		}
		
		var calculatedPercent = Math.floor((total / sections.length) * 100);
		
		var progressText = $("<p />");
		progressText.appendTo(container);
		progressText.css({
			textAlign: "center",
			fontSize: "48px",
			lineHeight: "1.6em",
			margin: "80px",
			marginBottom: "0px",
			color: "rgba(0, 0, 0, 0.4)",
			fontFamily: "\"Helvetica Neue Bold\", \"HelveticaNeue-Bold\""
		});
		progressText.html("<a onclick=\"updateInformation();\">Current Progress: <span style=\"color: rgba(0, 0, 0, 0.6);\">" + calculatedPercent + "%</span></a>");
		
		var helpText = $("<p />");
		helpText.appendTo(container);
		helpText.css({
			textAlign: "center",
			fontSize: "30px",
			lineHeight: "1.6em",
			color: "rgba(0, 0, 0, 0.6)",
			fontFamily: "\"Helvetica Neue\", \"HelveticaNeue\""
		});
		helpText.html("<span style=\"color: rgba(0, 0, 0, 0.4);\">If you need help with this app, stop by the iPad Help Desk (room 117) or Mr. Ruff's room (room 138).</span>");
		
	}
};

var globalLoadingCover;
var globalLoadingBox = null;
var globalLoadingText = null;
var globalLoadingCancelEvent = null;

var screenIntro = {
	id: "intro",
	title: "Jacketeer 2013",
	
	setup: function(container) {
		container.css({
            backgroundColor: "rgba(253, 249, 207, 0.2)",
            boxShadow: "inset 0px 0px 900px rgba(253, 249, 207, 0.8)",
		});
		
		var loginDetails = getLoginDetails();
		
		var page = $("<div />");
		page.appendTo(container);
		page.css({
			backgroundColor: "rgba(255, 255, 255, 0.99)",
			
			borderRadius: "15px",
			padding: "80px",
			
			position: "absolute",
			top: "50%",
			left: "50%",
			
			width: "1200px",
			height: "725px",
			
			marginLeft: "-680px",
			marginTop: "-500px",
			
			boxShadow: "0px 20px 40px rgba(0, 0, 0, 0.3)"
		});
		
		var title = $("<p />");
		title.appendTo(page);
		title.text("Jacketeer 2013 Student Portal");
		title.css({
			textAlign: "center",
			fontFamily: "\"Helvetica Neue Bold\", \"HelveticaNeue-Bold\"",
			fontSize: "72px"
		});
		
		var introText = $("<p />");
		introText.appendTo(page);
		introText.html("As you probably know, the senior section of the WCHS <em>Jacketeer</em> contains not only your senior picture, but also your favorite quote and your signature. This app will help you submit all of this informaton to us. In order to get started, please log in like you would at a WCHS computer.");
		introText.css({
			fontSize: "28px",
			marginTop: "40px",
			lineHeight: "1.8em",
			textAlign: "justify"
		});
		
		var tableHolder = $("<div />");
		tableHolder.appendTo(page);
		tableHolder.css({
			padding: "50px",
			borderRadius: "20px",
			//backgroundColor: "rgba(255, 249, 90, 0.8)",
            backgroundColor: "rgba(253, 249, 207, .7)",
			marginTop: "30px",
			position: "relative",
            border: "solid 2px rgba(150, 150, 150, 1)",
            boxShadow: "0px 0px 15px 5px rgba(255, 255, 255, 0.5)",
            boxShadow: "inset 0px 0px 20px rgba(100, 100, 0, 0.1)",
		});
		
		var table = $("<table />");
		table.appendTo(tableHolder);
		
		// user row
		var rowUser = $("<tr />");
		rowUser.appendTo(table);
		
		var labelUser = $("<label />");
		labelUser.text("Username:");
		labelUser.attr({
			for: "inputUser"
		});
		labelUser.css({
			fontSize: "34px",
			paddingRight: "20px",
			fontFamily: "\"Helvetica Neue Medium\", \"HelveticaNeue-Medium\"",
			marginRight: "10px"
		});
		
		rowUser.append($("<th />").css("paddingBottom", "20px").append(labelUser));
		
		var inputUser = $("<input type=\"text\" />");
		inputUser.attr({
			name: "inputUser",
			placeholder: "13jpdoe",
			autoCorrect: "off",
			autoCapitalize: "off"
		});
		inputUser.css({
			fontSize: "38px",
			padding: "10px",
			width: "610px"
		});
		
		if (loginDetails) {
			inputUser.val(loginDetails.user);
		}
		
		rowUser.append($("<td />").css("paddingBottom", "20px").append(inputUser));
		
		// password row
		var rowPassword = $("<tr />");
		rowPassword.appendTo(table);
		rowPassword.css({
			paddingBottom: "20px"
		});
		
		var labelPassword = $("<label />");
		labelPassword.text("Password:");
		labelPassword.attr({
			for: "inputPassword"
		});
		labelPassword.css({
			fontSize: "34px",
			paddingRight: "20px",
			fontFamily: "\"Helvetica Neue Medium\", \"HelveticaNeue-Medium\"",
			marginRight: "10px"
		});
		
		rowPassword.append($("<th />").append(labelPassword));
		
		var inputPassword = $("<input type=\"password\" />");
		inputPassword.attr({
			name: "inputPassword"
		});
		inputPassword.css({
			fontSize: "38px",
			padding: "10px",
			width: "610px"
		});
		
		if (loginDetails) {
			inputPassword.val(loginDetails.password);
		}
		
		rowPassword.append($("<td />").append(inputPassword));
		
		// loading cover
		var loadingCover = $("<div />");
		globalLoadingCover = loadingCover;
		loadingCover.appendTo(container);
		loadingCover.css({
			position: "absolute",
			top: "0px",
			left: "0px",
			right: "0px",
			bottom: "0px",
			backgroundColor: "rgba(0, 0, 0, 0.5)",
			zIndex: "100",
			display: "none"
		});
		
		var loadingBox = $("<div />");
		globalLoadingBox = loadingBox;
		loadingBox.appendTo(loadingCover);
		loadingBox.css({
			position: "absolute",
			top: "50%",
			left: "50%",
			
			width: "400px",
			height: "240px",
			
			marginLeft: "-230px",
			marginTop: "-150px",
			
			backgroundColor: "rgba(255, 255, 255, 1)",
			borderRadius: "20px",
			boxShadow: "0px 20px 20px rgba(0, 0, 0, 0.2)",
			
			padding: "30px"
		});
		
		var loadingImageContainer = $("<p />");
		loadingImageContainer.appendTo(loadingBox);
		loadingImageContainer.css({
			textAlign: "center"
		});
		
		var loadingImage = $("<img />");
		loadingImage.appendTo(loadingImageContainer);
		loadingImage.attr({
			src: "css/assets/loading.gif",
			width: 64,
			height: 64
		});
		
		var loadingText = $("<p />");
		globalLoadingText = loadingText;
		loadingText.appendTo(loadingBox);
		loadingText.css({
			textAlign: "center",
			fontSize: "38px",
			marginTop: "10px"
		});
		loadingText.text("Logging in...");
		
		var cancelButton = $("<input type=\"button\" />");
		cancelButton.appendTo(loadingBox);
		cancelButton.css({
			width: "400px",
			height: "80px",
			fontSize: "24px",
			marginTop: "40px"
		});
		cancelButton.val("Cancel");
		cancelButton.click(function() {
			if (globalLoadingCancelEvent) {
				globalLoadingCancelEvent();
			}
		});
		
		// login button
		var loginButton = $("<a />");
		loginButton.appendTo(tableHolder);
		loginButton.css({
			position: "absolute",
			top: "30px",
			right: "30px",
			bottom: "30px",
			width: "250px",
			borderRadius: "20px",
			backgroundColor: "rgba(255, 255, 255, 0)",
			fontSize: "96px",
			paddingTop: "50px",
			textAlign: "center",
			textDecoration: "none",
			color: "rgba(0, 0, 0, 0.5)"
		});
		loginButton.click(function() {
			loadingCover.stop(true).fadeIn(500);
			
			// send the request
			var req = $.ajax("https://jacketeer.org/app/login.php?a=" + (Math.floor(Math.random() * 99999999) + 1), {
				type: "POST",
				data: {user: inputUser.val(), password: inputPassword.val()},
				cache: false
			});
			
			globalLoadingText.text("Logging in...");
			globalLoadingCancelEvent = function() {
				req.aborted = true;
				req.abort();
				
				globalLoadingCover.stop(true).fadeOut(200);
			};
			
			req.done(function(content) {
				if (content.success) {
					if (! inputUser.val().startsWith("13")) {
						navigator.notification.alert("Only seniors need to fill in their information on this app. If you think you're seeing this message in error, please stop by the iPad Help Desk (room 117) for assistance.", null, "You're Not a Senior!", "Sorry!");
						loadingCover.stop(true).hide();
						return;
					}
					
					var map = {
						user: inputUser.val(),
						password: inputPassword.val()
					};
					
					localStorage.loginToken = content.user.SessionToken;
					localStorage.loginDetails = JSON.stringify(map);
					
					// load the information we need for the portal
					updateInformation();
				} else {
					navigator.notification.alert("Your username or password was incorrect. Please try again, or visit the iPad Help Desk (room 117) for assistance.", null, "Unsuccessful Login");
					loadingCover.stop(true).hide();
				}
			});
			
			req.fail(function() {
				if (req.aborted) {
					return;
				}
				
				navigator.notification.alert("Connection to the server failed. Please make sure you're connected to the internet or try again later. If you need help, you can stop by the iPad Help Desk (room 117) for assistance.", function(response) {
					if (response == 1) {
						loginButton.click();
					}
				}, "Connection Problems", "Try Again,Cancel");
				loadingCover.stop(true).hide();
			});
		});
		loginButton.html("&raquo;");
		
		// login by enter on input fields
		$("input[name='inputPassword'], input[name='inputUser']").keypress(function(e) {
			if (e.which == 13) {
				loginButton.click();
				$(this).blur(); // hide the iPad keyboard
				
				e.preventDefault();
				return false;
			}
		});
		
		// username tip at bottom
		var tipText = $("<p />");
		tipText.appendTo(page);
		tipText.html("Your username is the last two digits of your graduation year, followed by your first initial, your middle initial, and your full last name. For example, \"13jpdoe\" for \"John Price Doe\" graduating in 2013. It's the same thing you use to login to computers at WCHS.");
		tipText.css({
			fontSize: "24px",
			marginTop: "40px",
			lineHeight: "1.4em",
			textAlign: "justify"
		});
	}
};

// used by #updateInformation to refresh all info we have on the user
function actuallyUpdateInformation() {
	// send the request
	globalLoadingText.text("Downloading data...");

	var loginDetails = getLoginDetails();
	var req = $.ajax("https://jacketeer.org/app/info.php?a=" + (Math.floor(Math.random() * 99999999) + 1), {
		type: "POST",
		data: {user: loginDetails.user, token: localStorage.loginToken},
		cache: false
	});

	req.done(function(data) {
		if (data.success) {
			userInfo = data.info;
			setScreen(screenPortal);
		} else {
			navigator.notification.alert("Server error, please try again later or stop by the iPad Help Desk (room 117) for assistance.", null, "Server Error", "Uh oh!");
			globalLoadingCover.stop(true).hide();
		}
	});

	req.fail(function() {
		if (req.aborted) {
			return;
		}

		navigator.notification.alert("Connection to the server failed. Please make sure you're connected to the internet or try again later. If you need help, you can stop by the iPad Help Desk (room 117) for assistance.", function(response) {
			if (response == 1) {
				updateInformation();
			}
		}, "Connection Problems", "Try Again,Cancel");

		loadingCover.stop(true).hide();
	});
	
	return req;
}

// called by pretty much everything that needs to submit new data OR update the existing data
// handles submitting requests and then updating OR just updating (based on if reqToHandle is passed a map or not)
function updateInformation(reqToHandle) {
	// handle UI stuff
	if (! ui.screen || ui.screen.data("conf").id != "intro") {
		setScreen(screenIntro);
	}
	
	// show the loading screen
	if (! globalLoadingCover.is(":visible")) {
		globalLoadingCover.stop(true).show().fadeTo(0, 1);
	}
	
	globalLoadingText.text("Preparing to update...");
	
	// schedule and handle relevent requests
	var req;
	var updateTimeout;
	var submittedRealRequest = false;
	
	if (reqToHandle) {
		// need to submit some update request before reloading information
		// (other things will call this and ask it to pretty-please handle
		//  their requests before actually updating with fresh info from server)
		// 
		// but first, wait a second to avoid GUI glitches
		updateTimeout = setTimeout(function() {
			req = $.ajax("https://jacketeer.org/app/" + reqToHandle.path + "?a=" + (Math.floor(Math.random() * 99999999) + 1), {
				type: "POST",
				data: reqToHandle.data,
				cache: false
			});
		
			req.done(function(data) {
				if (data.success) {
					req = actuallyUpdateInformation();
				} else {
					navigator.notification.alert("Server error, please try again later or stop by the iPad Help Desk (room 117) for assistance.", null, "Server Error", "Uh oh!");
					globalLoadingCover.stop(true).hide();
				}
			});
		
			req.fail(function() {
				if (req.aborted) {
					return;
				}
				
				navigator.notification.alert("Connection to the server failed. Please make sure you're connected to the internet or try again later. If you need help, you can stop by the iPad Help Desk (room 117) for assistance.", function(response) {
					if (response == 1) {
						updateInformation(reqToHandle);
					}
				}, "Connection Problems", "Try Again,Cancel");
			});
		}, 1000);
		
		globalLoadingText.text("Saving changes...");
	} else {
		// there was no real function to submit, so wait a second before updating (to avoid GUI glitches)
		updateTimeout = setTimeout(function() {
			submittedRealRequest = true;
			req = actuallyUpdateInformation();
		}, 1000);
	}
	
	// handle what happens when we cancel
	globalLoadingCancelEvent = function() {
		// if we haven't submitted the actual request, just cancel the timeout it's waiting on
		if (updateTimeout && ! submittedRealRequest) {
			window.clearTimeout(updateTimeout);
		} else {
			req.aborted = true;
			req.abort();
		}
		
		globalLoadingCover.stop(true).fadeOut(500);
	};
}

function getLoginDetails() {
	var loginDetails = localStorage["loginDetails"];
	
	if (! loginDetails) {
		return null;
	}
	
	return JSON.parse(loginDetails);
}
