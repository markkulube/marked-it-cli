/**
 * marked-it-cli
 *
 * Copyright (c) 2020 IBM Corporation
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software
 * and associated documentation files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial
 * portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
 * LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

 /*
  * Examples of referencing audios:
  *
  * YouTube audio:
  * ![Watson Assistant product overview](https://www.youtube.com/embed/h-u-5f8fZtc?rel=0){: .audio width="640" height="390"}
  * 
  * Other audio:
  * ![Watson Assistant product overview](audio.mp4){: .audio width="640" height="390" controls}
  */

const url = require('url');
var html = {};
var logger;

const MIME_TYPES = {
	"3gp": "audio/3gpp",
	"avi": "audio/x-msaudio",
	"flv": "audio/x-flv",
	"m3u8": "application/x-mpegURL",
	"mov": "audio/quicktime",
	"mp4": "audio/mp4",
	"ts": "audio/MP2T",
	"wmv": "audio/x-ms-wmv"
}

html.onImage = function(html, data) {
	var image = data.htmlToDom(html)[0];
	if (!(image.attribs["audio"] !== undefined || (image.attribs["class"] || "").split(" ").indexOf("audio") !== -1)) {
		return; /* nothing to do */
	}

	var src = image.attribs["src"];
	if (!src) {
		logger.warning("Encountered a audio element that was missing the mandatory `src` attribute, so did NOT generate a audio tag for it");
		return;
	}

	if (image.attribs["class"]) {
		var segments = image.attribs["class"].split(" ");
		var index = segments.indexOf("audio");
		if (index !== -1) {
			segments.splice(index, 1);
			if (segments.length) {
				image.attribs["class"] = segments.join(" ");
			} else {
				delete image.attribs["class"];
			}
		}
	}
	delete image.attribs["audio"];
	delete image.attribs["src"];

	var alt = image.attribs["alt"];
	delete image.attribs["alt"];

	var output = image.attribs["output"];
	if (output === "iframe") {
		delete image.attribs["output"];
		var frame = data.htmlToDom(`<iframe src="${src}"></iframe>`)[0];
		if (alt) {
			frame.attribs["title"] = alt;
		}
		/* copy any remaining attributes into the <iframe> as-is */
		Object.keys(image.attribs).forEach(function(key) {
			frame.attribs[key] = image.attribs[key];
		});
		return data.domToHtml(frame);
	}

	var audio = data.htmlToDom(`<audio><source src="${src}">Your browser does not support the audio tag.</audio>`)[0];
	if (alt) {
		audio.attribs["title"] = alt;
	}

	/*
	 * Use the provided type if there is one, and otherwise try to determine it based on the extension.
	 */
	var type = image.attribs["type"];
	delete image.attribs["type"];
	if (!type) {
		var filename = src; /* default */
		try {
			var urlObj = new url.URL(src);
			filename = urlObj.pathname;
		} catch (e) {
			/*
			 * The src is not an url, so just try it as a filename, which is the default anyways.
			 */
		}
		var extension = filename.substring(filename.lastIndexOf(".") + 1);
		type = MIME_TYPES[extension];
	}
	if (type) {
		audio.children[0].attribs["type"] = type;
	}

	/* copy any remaining attributes into the <audio> as-is */
	Object.keys(image.attribs).forEach(function(key) {
		audio.attribs[key] = image.attribs[key];
	});
	return data.domToHtml(audio);
};

var init = function(data) {
	logger = data.logger;
}

module.exports.id = "audioExt";
module.exports.html = html;
module.exports.init = init;
