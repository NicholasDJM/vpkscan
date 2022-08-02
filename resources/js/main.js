
const getLocalPath = window.getLocalPath;
const getLocalString = window.getLocalString;
const translationsLoaded = window.translationsLoaded;
const length = window.length;
const getValueByIndex = window.getValueByIndex;
const getKeyByIndex = window.getKeyByIndex;
const log = window.log;
const delay = window.delay;

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
	log("TOTAL OF CONTENT: "+content[0]+1);
	for (let index = 1; index < content[0]+1; index++) {
		sortedData[0] = index;
		let final = {};
		final[0] = content[index].file;
		let data = content[index].stdOut.split(newline());
		for (const [index_, datum] of data.entries()) {
			if (datum!=="") {
				final[index_+1] = datum;
				counter++;
				$("#sortStatus").text(await getLocalString("sortStatus", counter.toLocaleString()));
			}
		}
		sortedData[index] = final;
	}
	return sortedData;
}

async function compare(data) {
	let conflicts = [];
	let counter = 0;
	for (let index = 1; index < data[0];index++) { // Start going thru the VPK files
		for (let index_ = 1; index_ < length(data[index]); index_++) { // Then go thru the files inside a particular VPK.
			let fileToCompare = data[index][index_];
			if (fileToCompare !== "sound/sound.cache" & fileToCompare !== "info.vdf") {// Don't compare sound caches or info.vdf files.
				for (let index2 = index+1;index2<data[0];index2++) { // Next, go thru all of the VPK files except the one we're comparing against.
					for (let index2_ = 1; index2_ < length(data[index2]);index2_++) { // Go thru all files inside the other VPKs.
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
	let folderContents = await readDirectory(folder);
	let data = "";
	for (let index = 2; index < length(folderContents); index++) {
		const subDirectory = folder + "\\" + folderContents[index].entry;
		data = folderContents[index].type === "FILE" ? data + subDirectory + newline() : data + await constructPath(subDirectory);
	}
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
								let counter = [0, 0]; // counter[0] = file counter, counter[1] = folder counter
								for (let index = 2; index < customDirectory.length; index++) {
									let handle = customDirectory[index];
									if (customDirectory[index].type === "FILE") {
										if (handle.entry.slice(-4)===".vpk") {
											let data = await exec("\""+ path +"\\bin\\vpk.exe\" l \""+ path +"\\tf\\custom\\"+ handle.entry +"\"");
											data.file = handle.entry;
											content[0] = content[0] + 1;
											content[content[0]] = data;
											counter[0] = counter[0] + 1;
										}
									}
									else {
										const cd = path+"\\tf\\custom";
										let data = await constructPath(cd+"\\"+handle.entry);
										data = data.split(cd);
										if (data[0]==="") {
											data.shift();
										}
										let completedString = "";
										let folderName;
										for (let file of data) {
											if (file[0] === "\\") {
												file = file.slice(1, file.length);
											}
											file = file.split("\\");
											folderName = file[0];
											file.shift();
											file = file.join("/");
											completedString = completedString + file;
										}
										let preContent = {stdOut: completedString, file: folderName};
										content[0] = content[0] + 1;
										content[content[0]] = preContent;
										counter[1] = counter[1]+1;
									}
									$("#scanStatus").text(await getLocalString("scanStatus", counter[0].toLocaleString(), counter[1].toLocaleString()));
								}
								log(content);
								await delay(500);
								let sortedData = await sort(content);
								log(sortedData);
								await delay(500);
								let finalData = await compare(sortedData);
								log(finalData);
								await delay(500);
								if (finalData.length > 0) {
									$("#resultsText").html(`<p>${getLocalString("foundConflicts", finalData.length)}</p>`);
									for (const finalDatum of finalData) {
										$("#table").append(`<tr class="tableData"><td>${finalDatum[0]}</td><td>${finalDatum[1]}</td><td>${finalDatum[2]}</td></tr>`);
										// TODO: Save data to storage, so the window can be closed and reopened and data can be referenced later without a rescan.
										// TODO: Split out displaying of data from this function, so we can display past data without rescanning.
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

