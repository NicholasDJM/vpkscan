const getLocalString = window.getLocalString;
$(()=>{
	$("[data-href]").each((index, element)=>{
		let url = $(element).attr("data-href");
		$(element).on("click", (event)=>{
			event.preventDefault();
			Neutralino.os.open(url);
		});
	});
	let open = false;
	const toggle = $("#toggle");
	toggle.on("click", ()=>{
		open ? toggle.text(getLocalString("toggleLicenseOpen")) : toggle.text(getLocalString("toggleLicenseClose"));
		open = !open;
		$("details").attr("open", open);
	});
	let count = 0;
	setInterval(()=>{
		count = 0;
		$("details").each((index, element)=>{
			if ($(element).attr("open")) count++;
		});
		if (count) {
			toggle.text(getLocalString("toggleLicenseClose"));
			open = true;
		} else {
			if (window.translationsLoaded()) {
				toggle.text(getLocalString("toggleLicenseOpen"));
			}
			open = false;
		}
	}, 10);
});
