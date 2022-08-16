//window.translationsDebug = true; // Uncomment if you want to find the corresponding translation key for a given element.

//window.debug = true; // Uncomment if you want log data to be displayed.

function log(...data) {
	if (window.debug) {
		if (data.length > 1) {
			console.log(data);
		} else {
			console.log(data[0]);
		}
		Neutralino.debug.log(data.toString());
	}
}
Neutralino.init();

Neutralino.events.on("windowClose", ()=>{
	Neutralino.app.exit();
});

// FIXME: Ask NeutralinoJS devs why I can't get the auto update function working.

let manifest;
async function getUpdate() {
	let url = NL_UPDATE_URL;
	log("Update URL: " + url);
	try {
		manifest = await Neutralino.updater.checkForUpdates(url);
		log(manifest);
		$("#updateVersion").text(getLocalString("updateNoticeVersion", manifest.version, NL_APPVERSION));
		$("#updateSummary").text(manifest.data.summary?? getLocalString("noSummary"));
		$("#updateNotice").show();
	} catch(error) {
		console.error(error);
	}
}

async function startUpdate() {
	if (manifest && manifest.version > NL_APPVERSION) {
		await Neutralino.updater.install();
		await Neutralino.app.restartProcess();
	}
}

function translationsLoaded() {
	return typeof(window.translations)==="object";
}

function length(object) {
	// Fuck you, Javascript.
	return Object.keys(object).length;
}
function getValueByIndex(object, index) {
	// FUCK... YOU..., JAVASCRIPT! THIS SHOULD BE THE SAME AS AN ARRAY! waytoomuchtimedebuggingthisbullshit
	return Object.values(object)[index];
}
function getKeyByIndex(object, index) {
	return Object.keys(object)[index];
}

function getLang() {
	if (translationsLoaded()) {
		for (let index = 0;index<navigator.languages.length;index++) {
			for (let index_ = 0;index_<length(window.translations.language);index_++) {
				let language = getKeyByIndex(window.translations.language, index_);
				if (language === navigator.languages[index]) {
					return navigator.languages[index];
				}
			}
		}
		console.warn("No suitable language found. Defaulting to English.");
		Neutralino.debug.log("No suitable language found. Defaulting to English.");
		return "en";
	}
	console.warn("Translations not loaded. Defaulting to English");
	return "en";
}


async function loadTranslationsWrapper() {
	await loadTranslations();
	hydrateTranslations();
	$("#version").each((index, element)=>{
		$(element).text(getLocalString("version", NL_APPVERSION));
	});
	//getUpdate();
}

async function loadTranslations() {
	await $.ajax("/translations.json")
		.done((data)=>{
			window.translations = data;
		})
		.fail((reason)=>{
			console.error(reason);
		});
}

function getOS(){
	return NL_OS.toLowerCase();
}

function getLocalPath(name) {
	if (translationsLoaded()) {
		return window.translations.os[getOS()][name];
	}
	console.error(`Translations not loaded! Cannot get correct path. Attempted to get ${NL_OS} equivalent of ${name}`);
}
function getLocalString(name, ...replacements) {
	if (translationsLoaded() & window.translationsDebug===undefined) {
		let translation = window.translations.language[getLang()][name];
		for (const [index, replacement] of replacements.entries()) {
			let pieces = translation.split(`%${index}%`);
			translation = pieces[0] + replacement + pieces[1];
		}
		return translation;
	}
	if (!window.translationsDebug) console.error("Translations not loaded. Attempted to get "+name);
	if (replacements.length > 0) {
		return `${name} (${replacements.length} replacement${replacements.length === 1 ? "" : "s"})`;
	}
	return name;
	
}

function hydrateTranslations() {
	// We don't check translationsLoaded(), so if translations fail to load, there's at least something to read still.
	$("[data-translation-key]").each((index, element)=>{
		let element_ = $(element);
		element_.text(getLocalString(element_.attr("data-translation-key")));
	});
}

//https://blog.praveen.science/right-way-of-delaying-execution-synchronously-in-javascript-without-using-loops-or-timeouts/
function delay(n = 2000) {
	return new Promise(done => {
		setTimeout(() => {
			done();
		}, n);
	});
}


$(()=>{
	$("#closeNoticeButton").on("click", ()=>{
		$("#updateNotice").hide();
	});
	loadTranslationsWrapper();
	/*$("#updateButton").on("click", ()=>{
		startUpdate()
	})*/
});


window.getLocalPath = getLocalPath;
window.getLocalString = getLocalString;
window.translationsLoaded = translationsLoaded;
window.length = length;
window.getValueByIndex = getValueByIndex;
window.getKeyByIndex = getKeyByIndex;
window.log = log;
window.delay = delay;