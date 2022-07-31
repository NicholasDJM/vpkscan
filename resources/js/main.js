
const getLocalPath = window.getLocalPath;
const getLocalString = window.getLocalString;
const translationsLoaded = window.translationsLoaded;
const length = window.length;
const getValueByIndex = window.getValueByIndex;
const getKeyByIndex = window.getKeyByIndex;
const log = window.log;


function setError(reason) {
	$("#errorText").text(reason);
	$("#error").show();
	const timing = 250;
	function anim(size) {
		$("#error").css("outline", size+"px solid #FF0000");
	}
	anim(5);
	setTimeout(()=>{
		anim(0);
	}, timing);
	setTimeout(()=>{
		anim(5);
	}, timing*2);
	setTimeout(()=>{
		anim(0);
	}, timing*3);
	setTimeout(()=>{
		anim(5);
	}, timing*4);
	setTimeout(()=>{
		anim(0);
	}, timing*5);
}

function closeError() {
	$("#error").hide();
}

async function readDirectory(path) {
	let file;
	try {
		file = await Neutralino.filesystem.readDirectory(path);
	} catch (error) {
		let message = error.message;
		let code = error.code;
		setError(code+" "+message);
		console.error(code, message);
		if (code === "NE_FS_NOPATHE") {
			setError(getLocalString("errorFolder"));
		}
		// eslint-disable-next-line unicorn/no-null
		return null;
	}
	if (file === undefined) {
		setError("File is undefined.");
		// eslint-disable-next-line unicorn/no-null
		return null;
	}
	return file;
}

function exists(directory, entry, type) {
	if (type===undefined) {
		type = "FILE";
	}
	// eslint-disable-next-line unicorn/no-null
	let result = null;
	// Start at 2 to skip the first two entries, they are always current directory and parent directory.
	for (let index = 2; index < directory.length; index++) {
		//log(directory[i]);
		if (directory[index].entry===entry & directory[index].type===type) {
			result = directory[index];
			break;
		}
	}
	return result;
}

async function exec(command) {
	return await Neutralino.os.execCommand(command);
}

function newline(escape) {
	return NL_OS === "Windows" ? "\r\n" : "\n";
	
}

async function sort(content) {
	let sortedData = {};
	sortedData[0] = 0;
	let counter = 0;
	for (let index = 1; index < content[0]+1; index++) {
		sortedData[0] = index;
		let final = {};
		final[0] = content[index].file;
		//compare[compare[0]+1].name = content[i].name
		let data = content[index].stdOut.split(newline());
		for (let index_=1; index_<data.length; index_++) {
			if (data[index_]!=="") {
				final[index_] = data[index_];
				counter++;
				$("#sortStatus").text(await getLocalString("sortStatus", counter.toLocaleString()));
			}
		}
		//final[-1] = counter;
		sortedData[index] = final;
	}
	return sortedData;
}

async function compare(data) {
	let conflicts = [];
	let counter = 0;
	for (let index = 1; index < data[0];index++) { // Start going thru the VPK files
		for (let index_ = 1; index_ < Object.keys(data[index]).length; index_++) { // Then go thru the files inside a particular VPK.
			let fileToCompare = data[index][index_];
			if (fileToCompare !== "sound/sound.cache" && // Don't compare sound caches.
				fileToCompare.split("/").length > 1) { // Don't compare root level files. These files don't affect the game.
				for (let index2 = index+1;index2<data[0];index2++) { // Next, go thru all of the VPK files except the one we're comparing against.
					for (let index2_ = 1; index2_ < Object.keys(data[index2]).length;index2_++) { // Go thru all files inside the other VPKs.
						counter++;
						$("#compareStatus").text(await getLocalString("compareStatus", counter.toLocaleString()));
						if (fileToCompare === data[index2][index2_]) {
							conflicts[conflicts.length] = [data[index][0], data[index2][0], fileToCompare];
						}
					}
				}
			}
		}
	}
	return conflicts;
}
let limit = 0;
async function constructPath(folder) {
	//log(folder)
	let folderContents = await readDirectory(folder);
	let data;
	log(folderContents);
	for (let index = 2; index < length(folderContents); index++) {
		const subDirectory = folder + "\\" + folderContents[index].entry;
		if (folderContents[index].type === "FILE") {
			log("FILE:", data);
			data = (data === undefined ? "" : data) + subDirectory + newline();
			log("FILE AFTER:", data);
		} else {
			log("TOTAL:", data);
			data = (data === undefined ? "" : data) + await constructPath(subDirectory);
			log("TOTAL AFTER:", data);
		}
		/* TODO: This is returning too early. We need to concat to a single variable, then return.
				Perhaps only return if entry type is file, otherwise construct path, then return whole string.*/
	}
	log("FINAL:", data);
	return data;
}

function enableElements() {
	$("#scanButton").attr("disabled", false);
	$("#pathInput").attr("disabled", false);
	$("#defaultButton").attr("disabled", false);
	$("#browseButton").attr("disabled", false);
}

async function startScan(path) {
	$("#scanStatus").text("");
	$("#sortStatus").text("");
	$("#compareStatus").text("");
	$("#time").text("");
	$("#resultsText").text("");
	$("#table").hide();
	$(".tableData").remove();
	$("#scanButton").attr("disabled", true);
	$("#pathInput").attr("disabled", true);
	$("#defaultButton").attr("disabled", true);
	$("#browseButton").attr("disabled", true);
	$("#loadOrderHint").hide();
	let content = {};
	content[0] = 0;
	let directory;
	try {
		directory = await readDirectory(path);
		if (directory!==null) {
			if (exists(directory, getLocalPath("hl2.exe"))) {
				if (exists(directory, "bin", "DIRECTORY")) {
					let binDirectory = await readDirectory(path+"/bin");
					if (exists(binDirectory, getLocalPath("vpk.exe"))) {
						log("Found vpk.exe.");
						if (exists(directory, "tf", "DIRECTORY")) {
							let tfDirectory = await readDirectory(path+"/tf");
							if (exists(tfDirectory, "custom", "DIRECTORY")) {
								log("Found custom folder.");
								let customDirectory = await readDirectory(path+"/tf/custom");
								let counter = [0, 0]; // [0] = files, [1] = folders
								for (let index = 2; index < customDirectory.length; index++) {
									let handle = customDirectory[index];
									if (customDirectory[index].type === "FILE") {
										if (handle.entry.slice(-4)===".vpk") {
											let data = await exec("\""+ path +"\\bin\\vpk.exe\" l \""+ path +"\\tf\\custom\\"+ handle.entry +"\"");
											//data.cmd = "\""+ path +"\\bin\\vpk.exe\" l \""+ path +"\\tf\\custom\\"+ handle.entry +"\"";
											data.file = handle.entry;
											content[0] = content[0] + 1;
											content[content[0]] = data;
											//log("VPK:", data);
											counter[0] = counter[0] + 1;
										}
									}
									else {
										log(handle);
										const cd = path+"\\tf\\custom";
										let data = await constructPath(cd+"\\"+handle.entry);
										log("RAW", data);
										data = data.split(cd);
										log("REMOVE CURRENT DIRECTORY AND SPLIT FILES", data);
										data.shift();
										log("DELETE FIRST ENTRY, SHOULD BE BLANK", data);
										//data = data[1];

										//log("GET FIRST DATAPOINT", data);
										let completedString = "";
										let folderName;
										for (let index_ = 0; index_ < data.length; index_++) {
											log("RAW", data);
											log("INDEX", index_);
											log("RAW INDEX", data[index_]);
											let file = data[index_];
											log("CONVERT TO PRIVATE VARIABLE", file);
											file = file.slice(1, file.length);
											log("REMOVE LEADING SLASH", file);
											file = file.split("\\");
											log("SPLIT BY SLASH", file);
											folderName = file[0];
											log("CAPTURE FOLDER NAME", folderName);
											file.shift();
											log("REMOVE FOLDER NAME FROM ARRAY", file);
											file = file.join("/");
											log("COMBINE DATA INTO STRING", file);
											completedString = completedString + file;
											log("ADD TO PRE CONTENT STRING", completedString);
										}
										let preContent = {stdOut: completedString, file: folderName};
										log("ADD FOLDER NAME TO PRE CONTENT STRING, ADD DATA", preContent);
										content[0] = content[0] + 1;
										content[content[0]] = preContent;
										log("ADD TO CONTENT", content);
										counter[1] = counter[1]+1;
									}
									$("#scanStatus").text(await getLocalString("scanStatus", counter[0].toLocaleString(), counter[1].toLocaleString()));
								}
								log(content);
								let sortedData = await sort(content);
								let finalData = await compare(sortedData);
								if (finalData.length > 0) {
									$("#resultsText").html(`<p>${getLocalString("foundConflicts", finalData.length)}</p>`);
									for (const finalDatum of finalData) {
										$("#table").append(`<tr class="tableData"><td>${finalDatum[0]}</td><td>${finalDatum[1]}</td><td>${finalDatum[2]}</td></tr>`);
										// TODO: Save data to storage, so the window can be closed and reopened and data can be referenced later without a rescan.
									}
									$("#table").show();
								} else {
									$("#resultsText").html(`<p>${getLocalString("noConflicts")}</p>`);
								}
							} else {
								setError(getLocalString("errorCustomFolder"));
								return;
							}
						} else {
							setError(getLocalString("errorTfFolder"));
							return;
						}
					} else {
						setError(getLocalString("errorVPKexe", getLocalPath("vpk.exe")));
						return;
					}
				} else {
					setError(getLocalString("errorBinFolder"));
					return;
				}
			} else {
				setError(getLocalString("errorHL2exe", getLocalPath("hl2.exe")));
				return;
			}
		}
	} finally {
		enableElements();
		$("#loadOrderHint").show();
	}
}

async function getPath() {
	let data = await Neutralino.storage.getData("path")
		.then((data)=>{
			$("#pathInput").val(data);
		})
		.catch((error)=>{
			if (error.code!=="NE_ST_NOSTKEX") {
				console.error(error);
			}
		});
}

async function measureScan() {
	const spinner = $("#spinner");
	spinner.show();
	const t0 = performance.now();
	await startScan($("#pathInput").val());
	const t1 = performance.now();
	spinner.hide();
	//$("#time").html(`Took <span title="${t1-t0} milliseconds" style="text-decoration:none;border-bottom: 1px dotted black">${Math.round(t1-t0) / 1000}</span> seconds to scan.`);
	$("#time").html(getLocalString("processTime", `<span title="${getLocalString("processTimeTooltip", t1-t0)}" style="text-decoration:none;border-bottom: 1px dotted black">${Math.round(t1-t0) / 1000}</span>`));
}


$(()=>{
	let pathInput = $("#pathInput");
	$("#defaultButton").on("click", ()=>{
		pathInput.val(getLocalPath("defaultPath"));
		Neutralino.storage.setData("path", $("#pathInput").val());
	});
	pathInput.on("input", (event)=>{
		Neutralino.storage.setData("path", $(event.target).val());
	});
	let button = $("#scanButton");
	button.on("click", (event)=>{
		measureScan();
	});
	$("#closeError").on("click", (event)=>{
		closeError();
	});
	$("#browseButton").on("click", (event)=>{
		let options;
		translationsLoaded() ? options = {defaultPath: getLocalPath("defaultPath")}:"";
		Neutralino.os.showFolderDialog("Location of HL2.exe", options)
			.then((path)=>{
				if (path!=="") {
					pathInput.val(path);
					Neutralino.storage.setData("path", $("#pathInput").val());
				}
			}).catch((error)=>{
				console.error(error);
			});
	});
	const a = setInterval(()=>{
		if (translationsLoaded()) {
			$("[data-translation-key='pathLabel']").text(getLocalString("pathLabel", getLocalPath("hl2.exe")));
			enableElements();
			clearInterval(a);
		}
	}, 10);
	getPath();
});