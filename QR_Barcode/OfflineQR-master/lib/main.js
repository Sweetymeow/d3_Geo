// Import the APIs we need.
var panel = require("sdk/panel");
var { Hotkey } = require("sdk/hotkeys");
var data = require("sdk/self").data;
var prefs = require("sdk/simple-prefs");

var {ActionButton} = require("sdk/ui/button/action");

var button = ActionButton({
    id: "qr-button",
    label: "Show QR",
    icon: {
      "16": data.url("toolbar/assets/qr-button-16.png"),
      "32": data.url("toolbar/assets/qr-button-32.png")
    },
    onClick: function(state) {
		findAndSendQRText();
    }
});
 
exports.main = function(options, callbacks)
{
	prefs.on("QRBlockSize", handlePrefChange);
	prefs.on("QRErrorCorrectLevel", handlePrefChange);
	prefs.on("ShowInContextMenu", handlePrefChange);
	
	setupContextMenu();
  
	Hotkey(
		{
			combo: "alt-shift-q",
			onPress: function(){findAndSendQRText();}
		}
	);
};


var pageContextMenu;
var selectionContextMenu;
var imageContextMenu;
var linkContextMenu;
var backgroundContextMenu;
function setupContextMenu()
{
  var menuPref = prefs.prefs["ShowInContextMenu"];
  if(menuPref && !(pageContextMenu && selectionContextMenu))
  {
	removeContextMenu();
	createContextMenus();
  }
  else if(!menuPref)
  {
	removeContextMenu();
  }
}

function createContextMenus()
{
  var contextMenu = require("sdk/context-menu");

  pageContextMenu = contextMenu.Item({
    label: "Show QR",
    // Show this item when no selection exists.
    context: contextMenu.PageContext(),
    // When this item is clicked, post a message back with the selection
    contentScript: 'self.on("click", function (junk) {self.postMessage("junk");});',
    // When we receive a message, look up the item
    onMessage: function (junk) {
      findAndSendQRText();
    }
  });
 
  selectionContextMenu = contextMenu.Item({
    label: "Show QR",
    // Show this item when a selection exists.
    context: contextMenu.SelectionContext(),
    // When this item is clicked, post a message back with the selection
    contentScript: 'self.on("click", function (junk) {self.postMessage("junk");});',
    // When we receive a message, look up the item
    onMessage: function (junk) {
      findAndSendQRText();
    }
  });
 
  imageContextMenu = contextMenu.Item({
    label: "Show QR for image source",
    // Show this item when an img is right-clicked on.
    context: contextMenu.SelectorContext("img"),
    // When this item is clicked, post a message back with the selection
    contentScript: 'self.on("click", function (node) {self.postMessage(node.src);});',
    // When we receive a message, look up the item
    onMessage: function (imgSrc) {
      sendQRText(imgSrc);
    }
  });
 
  linkContextMenu = contextMenu.Item({
    label: "Show QR for link",
    // Show this item when an img is right-clicked on.
    context: contextMenu.SelectorContext("a"),
    // When this item is clicked, post a message back with the selection
    contentScript: 'self.on("click", function (node) {self.postMessage(node.href);});',
    // When we receive a message, look up the item
    onMessage: function (link) {
      sendQRText(link);
    }
  });

  backgroundContextMenu = contextMenu.Item({
    label: "Show QR for background image",
    // Show this item when an page with background is right-clicked on (the click happens over html element though).
    context: contextMenu.PageContext(),
    contentScript:
        // When this item is clicked, see page has a body node with "background" attribute
        'self.on("context", function (node) {return !!document.querySelector("body[background]");});'
        // When this item is clicked, post a message back with the background link
        + 'self.on("click", function (node) {self.postMessage(document.querySelector("body[background]").background);});',
    // When we receive a message, look up the item
    onMessage: function (link) {
      sendQRText(link);
    }
  });
}

function removeContextMenu()
{
	if(pageContextMenu)
	{
		pageContextMenu.destroy();
		pageContextMenu = undefined;
	}
	
	if(selectionContextMenu)
	{
		selectionContextMenu.destroy();
		selectionContextMenu = undefined;
	}
	
	if(imageContextMenu)
	{
		imageContextMenu.destroy();
		imageContextMenu = undefined;
	}
	
	if(linkContextMenu)
	{
		linkContextMenu.destroy();
		linkContextMenu = undefined;
	}

	if(backgroundContextMenu)
	{
		backgroundContextMenu.destroy();
		backgroundContextMenu = undefined;
	}
}

var qrCodePanel = panel.Panel(
{
	width: 30,
	height: 30,
	contentURL: data.url("htmlQR/index.html?isAddon=true")
});
qrCodePanel.on("show", function()
{
	showOrUpdateQR();
});
qrCodePanel.port.on("resizePanel", function(payloadFromPanel)
{
	resizePanel(payloadFromPanel["width"], payloadFromPanel["height"]);
});
qrCodePanel.port.on("openNew", function(payloadFromPanel)
{
	openNew(payloadFromPanel["text"]);
	qrCodePanel.hide();
});
qrCodePanel.port.on("showExtraUI", function(toShow)
{
	setShowExtraUI(toShow);
});
qrCodePanel.port.on("setBlockSize", function(blockSize)
{
	setPreferredBlockSize(blockSize);
});

function sendShowQRMsg()
{
	if(!textToBeShown || textToBeShown=="")return;
	
	var blockSize = getPreferredBlockSize();
	
 	qrCodePanel.port.emit("myAddonScriptEvent", {"event":"showQR",
													"text":textToBeShown,
													"errorCorrectLevel": getPreferedQRErrorCorrectLevel(),
													"blockSize": blockSize,
													"showExtraUI": getShowExtraUI()
												});
}

var textToBeShown;
function sendQRText(text)
{
	textToBeShown = text;
	showOrUpdateQR();
}

function resizePanel(width, height)
{
	qrCodePanel.resize(width, height);
}

function openNew(text)
{
	require("sdk/tabs").open(data.url("htmlQR/index.html")
		+ "?loadText=" + text
		+ "&errorCorrectLevel=" + getPreferedQRErrorCorrectLevel()
		+ "&blockSize=" + getPreferredBlockSize()
	);
}

function findAndSendQRText()
{
	var text = require("sdk/selection").text;
	if(!text || text=="")
	{
		text = require("sdk/tabs").activeTab.url;
	}
	sendQRText(text);
}

function showOrUpdateQR()
{
	if(qrCodePanel.isShowing)
	{
		sendShowQRMsg();
	}
	else
	{
		qrCodePanel.show();
	}
}

function handlePrefChange(prefName)
{
	switch(prefName)
	{
		case "QRErrorCorrectLevel":
			prefVal = prefs.prefs["QRErrorCorrectLevel"].toLowerCase();
			if(prefVal && prefVal!="l" && prefVal!="m" && prefVal!="q" && prefVal!="h" && prefVal!="")
			{
				prefs.prefs["QRErrorCorrectLevel"] = "L";
			}
			else if(prefVal)
			{
				prefs.prefs["QRErrorCorrectLevel"] = prefVal.toUpperCase();
			}
			break;
		case "QRBlockSize":
			prefVal = prefs.prefs["QRBlockSize"];
			if(prefVal<1 || prefVal>10)
			{
				prefs.prefs["QRBlockSize"] = 3;
			}
			break;
		case "ShowInContextMenu":
			setupContextMenu();
		default:
			break;
	}
}
 
function getPreferedQRErrorCorrectLevel()
{
	return prefs.prefs["QRErrorCorrectLevel"];
}

function getPreferredBlockSize()
{
	return prefs.prefs["QRBlockSize"];
}

function setPreferredBlockSize(blockSize)
{
	if(isNaN(blockSize) || blockSize<1 || blockSize>10)
		return;

	prefs.prefs["QRBlockSize"] = blockSize;
}

/*
	We're not exposing showExtraUI preference in the options pane (no entry in package.json)
	It's intuitive enough on the main panel itself and would unnecessarily
	crowd up the options page.
*/
function getShowExtraUI()
{
	var ret = prefs.prefs["showExtraUI"];
	if(ret==undefined)
	{	
		ret = prefs.prefs["showExtraUI"] = true;
	}
	
	return ret;
}
function setShowExtraUI(showExtraUI)
{
	if(showExtraUI!=undefined)
		prefs.prefs["showExtraUI"] = showExtraUI;
}